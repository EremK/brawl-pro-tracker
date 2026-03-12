import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { OnModuleInit } from '@nestjs/common';

import { TrackedPlayerEntity } from '../db/entities/tracked-player.entity';
import { BattleEntity } from '../db/entities/battle.entity';
import { BattleTeamPickEntity } from '../db/entities/battle-team-pick.entity';
import { BrawlerEntity } from '../db/entities/brawler.entity';
import { UserProfileEntity } from '../db/entities/user-profile.entity';
import { UserBattleEntity } from '../db/entities/user-battle.entity';
import { UserBattlePickEntity } from '../db/entities/user-battle-pick.entity';

type BattlelogResponse = { items: any[] };
type PlayerProfileResponse = {
    name?: string
    icon?: { id?: number }
    club?: { name?: string }
    trophies?: number
    powerPlayPoints?: number
    power_play_points?: number
    currentPowerPlayPoints?: number
    highestPowerPlayPoints?: number
    highest_power_play_points?: number
    '3vs3Victories'?: number
    teamVictories?: number
    soloVictories?: number
}

function normTag(tag: string) {
    const t = (tag || '').trim().toUpperCase();
    return t.startsWith('#') ? t : `#${t}`;
}

function parseBrawlBattleTime(bt: string): Date | null {
    // Expected: YYYYMMDDTHHMMSS.mmmZ  e.g. 20260224T051317.000Z
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/.exec(bt);
    if (!m) return null;

    const [, Y, Mo, D, H, Mi, S, Ms] = m;
    const iso = `${Y}-${Mo}-${D}T${H}:${Mi}:${S}.${Ms}Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

function teamHasTag(team: any[], tag: string): boolean {
    if (!Array.isArray(team)) return false;
    const t = (tag || '').trim().toUpperCase();
    const norm = t.startsWith('#') ? t : `#${t}`;
    return team.some(p => String(p?.tag || '').trim().toUpperCase() === norm);
}

function extractBrawlersFromItem(item: any): Array<{ id: number; name: string }> {
    const out: Array<{ id: number; name: string }> = [];

    const push = (b: any) => {
        const id = b?.id;
        const name = b?.name;
        if (typeof id === 'number' && typeof name === 'string' && name.length) {
            out.push({ id, name });
        }
    };

    // from teams
    const teams = item?.battle?.teams;
    if (Array.isArray(teams)) {
        for (const team of teams) {
            if (!Array.isArray(team)) continue;
            for (const p of team) push(p?.brawler);
        }
    }

    // from starPlayer (sometimes exists)
    push(item?.battle?.starPlayer?.brawler);

    return out;
}

function findPlayerBrawlerId(item: any, tag: string): number | null {
    const teams = item?.battle?.teams
    const norm = normTag(tag)

    if (!Array.isArray(teams)) return null

    for (const team of teams) {
        if (!Array.isArray(team)) continue
        for (const player of team) {
            const playerTag = String(player?.tag ?? '').trim().toUpperCase()
            if (playerTag !== norm) continue

            const brawlerId = player?.brawler?.id
            return typeof brawlerId === 'number' ? brawlerId : null
        }
    }

    return null
}

function classifyCategory(battleType: string): 'ranked' | 'ladder' | 'special' | 'unknown' {
    const t = (battleType || '').trim();

    // ✅ real Ranked
    if (t === 'soloRanked') return 'ranked';

    // ✅ Ladder (normal trophies)
    if (t === 'ranked') return 'ladder';

    // ✅ “3rd category”
    if (t === 'friendly' || t === 'tournament') return 'special';

    return 'unknown';
}

function encodeTagForUrl(tag: string) {
    // Brawl endpoint expects %23 for '#'
    return `%23${tag.replace('#', '').trim()}`;
}

function compKeyFromTeam(team: any[]): { compKey: string; ids: number[] } | null {
    if (!Array.isArray(team)) return null;

    const ids = team
        .map(p => p?.brawler?.id)
        .filter((x: any) => typeof x === 'number');

    if (![1, 2, 3, 5].includes(ids.length)) return null;

    ids.sort((a, b) => a - b);
    return { compKey: ids.join('-'), ids };
}

function isShowdownMode(mode?: string | null) {
    const m = (mode ?? '').trim().toLowerCase()
    return m === 'soloshowdown' || m === 'duoshowdown' || m === 'trioshowdown'
}

function inferResultFromRaw(raw: any): string | null {
    const mode = String(raw?.battle?.mode ?? '').trim()
    if (!isShowdownMode(mode)) {
        // for non-showdown you probably already use raw.battle.result
        return (typeof raw?.battle?.result === 'string') ? raw.battle.result : null
    }

    const rank = Number(raw?.battle?.rank)
    if (!Number.isFinite(rank)) return null

    // simplest definition: only rank 1 is a win
    return rank === 1 ? 'victory' : 'defeat'
}

@Injectable()
export class CollectorService {
    private readonly log = new Logger(CollectorService.name);
    private brawlerNameById = new Map<number, string>();
    private brawlerCacheReady = false;
    private brawlerCacheUpdatedAt: Date | null = null;

    constructor(
        private readonly cfg: ConfigService,
        @InjectRepository(TrackedPlayerEntity) private readonly trackedRepo: Repository<TrackedPlayerEntity>,
        @InjectRepository(BattleEntity) private readonly battleRepo: Repository<BattleEntity>,
        @InjectRepository(BattleTeamPickEntity) private readonly picksRepo: Repository<BattleTeamPickEntity>,
        @InjectRepository(BrawlerEntity) private readonly brawlerRepo: Repository<BrawlerEntity>,
        @InjectRepository(UserProfileEntity) private readonly userProfileRepo: Repository<UserProfileEntity>,
        @InjectRepository(UserBattleEntity) private readonly userBattleRepo: Repository<UserBattleEntity>,
        @InjectRepository(UserBattlePickEntity) private readonly userPickRepo: Repository<UserBattlePickEntity>,
    ) { }

    async onModuleInit() {
        await this.refreshBrawlerCache();
    }

    @Cron('*/15 * * * *')
    async refreshBrawlerCacheCron() {
        await this.refreshBrawlerCache();
    }

    async refreshBrawlerCache() {
        const rows = await this.brawlerRepo.find(); // brawlers table is small -> OK
        const next = new Map<number, string>();
        for (const r of rows) next.set(r.id, r.name);

        this.brawlerNameById = next;
        this.brawlerCacheReady = true;
        this.brawlerCacheUpdatedAt = new Date();

        this.log.log(`brawler cache refreshed (${rows.length})`);
    }

    brawlerName(id: number): string {
        return this.brawlerNameById.get(id) ?? `#${id}`;
    }

    brawlerNames(ids: number[]): string[] {
        return ids.map(id => this.brawlerName(id));
    }

    brawlerCacheInfo() {
        return {
            ready: this.brawlerCacheReady,
            size: this.brawlerNameById.size,
            updatedAt: this.brawlerCacheUpdatedAt,
        };
    }

    // pro-data sync
    @Cron('*/15 * * * *')
    async tick() {
        if (process.env.COLLECTOR_ENABLED !== 'true') return;
        const tracked = await this.trackedRepo.find({ where: { active: true } });

        for (const p of tracked) {
            try {
                await this.pullAndStore(p.tag);
            } catch (e: any) {
                this.log.warn(`pull failed for ${p.tag}: ${e?.message ?? e}`);
            }
        }
    }

    // user-profile sync
    @Cron('*/20 * * * *')
    async syncProfilesTick() {
        if (process.env.COLLECTOR_ENABLED !== 'true') return;

        const profiles = await this.userProfileRepo
            .createQueryBuilder('p')
            .where('p.playerTag IS NOT NULL')
            .getMany();

        for (const profile of profiles) {
            if (!profile.playerTag) continue;

            try {
                const result = await this.syncUserProfileBattles(profile.userId, profile.playerTag);
                profile.lastSyncedAt = new Date();
                if (result.playerName) {
                    profile.playerName = result.playerName;
                }
                await this.userProfileRepo.save(profile);
            } catch (e: any) {
                this.log.warn(`profile sync failed for ${profile.userId}: ${e?.message ?? e}`);
            }
        }
    }

    @Cron('10 3 * * *')
    async cleanupOldBattles() {
        const days = Number(this.cfg.get<string>('DATA_RETENTION_DAYS') ?? 60);
        const safeDays = Number.isFinite(days) ? Math.max(1, Math.min(365, days)) : 60;

        const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

        const delPicks = await this.picksRepo.query(
            `DELETE FROM "battle_team_picks"
     WHERE "battleId" IN (
       SELECT "battleId" FROM "battles" WHERE "battleTime" < $1
     )`,
            [cutoff],
        );

        const delBattles = await this.battleRepo.delete({ battleTime: LessThan(cutoff) });
        await this.userPickRepo.query(
            `DELETE FROM "user_battle_picks"
     WHERE "battleId" IN (
       SELECT "battleId" FROM "user_battles" WHERE "battleTime" < $1
     )`,
            [cutoff],
        );
        await this.userBattleRepo.delete({ battleTime: LessThan(cutoff) });
        await this.userProfileRepo
            .createQueryBuilder()
            .update(UserProfileEntity)
            .set({ lastSyncedAt: null })
            .where(`NOT EXISTS (
                SELECT 1
                FROM "user_battles" ub
                WHERE ub."userId" = "user_profiles"."userId"
            )`)
            .execute();

        this.log.log(
            `cleanup: retention=${safeDays}d cutoff=${cutoff.toISOString()} battlesDeleted=${delBattles.affected ?? 0}`,
        );
    }

    async collectNowForAll(): Promise<{ processed: number }> {
        const tracked = await this.trackedRepo.find({ where: { active: true } });
        for (const p of tracked) {
            try {
                await this.pullAndStore(p.tag);
            } catch (e: any) {
                this.log.warn(`collect-now failed for ${p.tag}: ${e?.message ?? e}`);
            }
        }
        return { processed: tracked.length };
    }

    async syncUserProfileBattles(userId: string, playerTag: string): Promise<{
        processed: number
        playerName: string | null
        profileIconId: number | null
        clubName: string | null
        trophies: number | null
        victories3v3: number | null
    }> {
        const token = this.cfg.get<string>('BRAWL_API_TOKEN');
        const baseUrl = this.cfg.get<string>('BRAWL_API_BASE_URL') ?? 'https://api.brawlstars.com/v1';

        const tag = normTag(playerTag);
        const encodedTag = encodeTagForUrl(tag);

        const [playerRes, battlelogRes] = await Promise.all([
            axios.get<PlayerProfileResponse>(`${baseUrl}/players/${encodedTag}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15_000,
            }),
            axios.get<BattlelogResponse>(`${baseUrl}/players/${encodedTag}/battlelog`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15_000,
            }),
        ]);

        const processed = await this.ingestUserBattlelog(userId, tag, battlelogRes.data.items ?? []);
        return {
            processed,
            playerName: typeof playerRes.data?.name === 'string' ? playerRes.data.name : null,
            profileIconId: typeof playerRes.data?.icon?.id === 'number' ? playerRes.data.icon.id : null,
            clubName: typeof playerRes.data?.club?.name === 'string' ? playerRes.data.club.name : null,
            trophies: typeof playerRes.data?.trophies === 'number' ? playerRes.data.trophies : null,
            victories3v3: typeof playerRes.data?.['3vs3Victories'] === 'number'
                ? playerRes.data['3vs3Victories']
                : (typeof playerRes.data?.teamVictories === 'number' ? playerRes.data.teamVictories : null),
        };
    }

    async loadTopPlayers(countryCode: string = 'global', limit: number = 200, replaceActive: boolean = false) {
        const token = this.cfg.get<string>('BRAWL_API_TOKEN');
        const baseUrl = this.cfg.get<string>('BRAWL_API_BASE_URL') ?? 'https://api.brawlstars.com/v1';
        if (!token) throw new Error('BRAWL_API_TOKEN is not set');

        const cc = (countryCode || 'global').toLowerCase();
        const lim = Math.max(1, Math.min(200, Number(limit) || 200));

        // optional: disable everyone first (so only leaderboard stays active)
        if (replaceActive) {
            await this.trackedRepo.update({}, { active: false });
        }

        const url = `${baseUrl}/rankings/${encodeURIComponent(cc)}/players?limit=${lim}`;

        const res = await axios.get<{ items: any[] }>(url, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15_000,
        });

        const items = Array.isArray(res.data?.items) ? res.data.items : [];

        // API items look like: { tag, name, trophies, rank, ... }
        for (const it of items) {
            const tag = normTag(it?.tag);
            const name = typeof it?.name === 'string' ? it.name : null;
            if (!tag) continue;

            await this.trackedRepo.upsert(
                {
                    tag,
                    name,
                    source: 'leaderboard',
                    active: true,
                },
                ['tag'],
            );
        }

        return { ok: true, countryCode: cc, limit: lim, imported: items.length, replaceActive };
    }

    private async pullAndStore(playerTag: string) {
        const token = this.cfg.get<string>('BRAWL_API_TOKEN');
        const baseUrl = this.cfg.get<string>('BRAWL_API_BASE_URL') ?? 'https://api.brawlstars.com/v1';

        const tag = normTag(playerTag);
        const url = `${baseUrl}/players/${encodeTagForUrl(tag)}/battlelog`;

        const res = await axios.get<BattlelogResponse>(url, {
            headers: { Authorization: `Bearer ${token}` }, // Bearer auth :contentReference[oaicite:4]{index=4}
            timeout: 15_000,
        });

        for (const item of res.data.items ?? []) {
            // Create deterministic id (battleTime + map + mode + teams)
            // Official API doesn't expose battle id in your sample, so we make our own.
            const bt = item?.battleTime;
            const mode = item?.event?.mode;
            const map = item?.event?.map;
            const teams = item?.battle?.teams;
            const brawlers = extractBrawlersFromItem(item);
            for (const b of brawlers) {
                // Upsert by PK id: insert if new, update name if changed
                await this.brawlerRepo.upsert(b, ['id']);
                this.brawlerNameById.set(b.id, b.name); 
            }

            if (!bt || !mode || !map || !Array.isArray(teams)) continue;

            const longKey = `${bt}|${mode}|${map}|${JSON.stringify(teams)}`;
            const battleId = createHash('sha256').update(longKey).digest('hex');

            const battleTime = parseBrawlBattleTime(bt);
            if (!battleTime) continue; // skip if format unexpected
            const battleType = item?.battle?.type ?? 'unknown';
            const category = classifyCategory(battleType);
            const result = inferResultFromRaw(item)
            const duration = typeof item?.battle?.duration === 'number' ? item.battle.duration : null;
            

            const insertBattle = await this.battleRepo
                .createQueryBuilder()
                .insert()
                .into(BattleEntity)
                .values({
                    battleId,
                    battleTime,
                    mode,
                    map,
                    battleType,
                    category,
                    result,
                    duration,
                    observedFromTag: tag,
                    raw: item,
                })
                .onConflict('("battleId") DO NOTHING')
                .execute();

            if (!insertBattle.identifiers.length) continue;

            for (let side = 0; side < teams.length; side++) {
                const team = teams[side];
                const comp = compKeyFromTeam(team);

                if (!comp) continue;

                const isProSide = teamHasTag(team, tag);
                const ids = comp.ids;

                await this.picksRepo
                    .createQueryBuilder()
                    .insert()
                    .into(BattleTeamPickEntity)
                    .values({
                        battleId,
                        side,
                        compKey: comp.compKey,
                        teamSize: ids.length,
                        b1: ids[0] ?? null,
                        b2: ids[1] ?? null,
                        b3: ids[2] ?? null,
                        b4: ids[3] ?? null,
                        b5: ids[4] ?? null,
                        isProSide,
                    })
                    .onConflict('("battleId", side) DO NOTHING')
                    .execute();
            }
        }

        this.log.log(`ingested for ${tag}`);
    }

    private async ingestUserBattlelog(userId: string, playerTag: string, items: any[]) {
        let inserted = 0;

        for (const item of items) {
            const bt = item?.battleTime;
            const mode = item?.event?.mode;
            const map = item?.event?.map;
            const teams = item?.battle?.teams;
            const brawlers = extractBrawlersFromItem(item);

            for (const b of brawlers) {
                await this.brawlerRepo.upsert(b, ['id']);
                this.brawlerNameById.set(b.id, b.name);
            }

            if (!bt || !mode || !map || !Array.isArray(teams)) continue;

            const longKey = `${userId}|${bt}|${mode}|${map}|${JSON.stringify(teams)}`;
            const battleId = createHash('sha256').update(longKey).digest('hex');

            const battleTime = parseBrawlBattleTime(bt);
            if (!battleTime) continue;

            const battleType = item?.battle?.type ?? 'unknown';
            const category = classifyCategory(battleType);
            const result = inferResultFromRaw(item);
            const duration = typeof item?.battle?.duration === 'number' ? item.battle.duration : null;
            const userBrawlerId = findPlayerBrawlerId(item, playerTag);

            const insertBattle = await this.userBattleRepo
                .createQueryBuilder()
                .insert()
                .into(UserBattleEntity)
                .values({
                    battleId,
                    userId,
                    battleTime,
                    mode,
                    map,
                    battleType,
                    category,
                    result,
                    duration,
                    userBrawlerId,
                    observedFromTag: playerTag,
                    raw: item,
                })
                .onConflict(
                    '("battleId") DO UPDATE SET "userBrawlerId" = EXCLUDED."userBrawlerId", "raw" = EXCLUDED."raw"',
                )
                .execute();

            if (insertBattle.identifiers.length) inserted++;

            for (let side = 0; side < teams.length; side++) {
                const team = teams[side];
                const comp = compKeyFromTeam(team);
                if (!comp) continue;

                const ids = comp.ids;

                await this.userPickRepo
                    .createQueryBuilder()
                    .insert()
                    .into(UserBattlePickEntity)
                    .values({
                        battleId,
                        userId,
                        side,
                        compKey: comp.compKey,
                        teamSize: ids.length,
                        b1: ids[0] ?? null,
                        b2: ids[1] ?? null,
                        b3: ids[2] ?? null,
                        b4: ids[3] ?? null,
                        b5: ids[4] ?? null,
                        isUserSide: teamHasTag(team, playerTag),
                    })
                    .onConflict('("battleId", side) DO NOTHING')
                    .execute();
            }
        }

        return inserted;
    }
}
