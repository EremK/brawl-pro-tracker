import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';
import { AddTrackedDto } from './dto/add-tracked.dto';
import { TrackedPlayerEntity } from './db/entities/tracked-player.entity';
import { BattleEntity } from './db/entities/battle.entity';
import { BattleTeamPickEntity } from './db/entities/battle-team-pick.entity';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { DisableTrackedDto } from './dto/disable-tracked.dto';
import { CollectorService } from './collector/collector.service';
import { BrawlerEntity } from './db/entities/brawler.entity';
import { AdminAccessGuard } from './auth/admin-access.guard';
import { AuthService } from './auth/auth.service';
import { extractBearerToken } from './auth/token.helpers';
import axios from 'axios';
import { classificationForName, scoreDraftFit } from './ranked-helper/draft-scoring';
import { UserProfileEntity } from './db/entities/user-profile.entity';

function normTag(tag: string) {
  const t = (tag || '').trim().toUpperCase();
  return t.startsWith('#') ? t : `#${t}`;
}

function compKeyToIds(compKey: string): number[] {
  return String(compKey).split('-').map(Number).filter(n => !Number.isNaN(n));
}

function isShowdownMode(mode?: string | null) {
  const m = (mode ?? '').trim().toLowerCase()
  return m === 'soloshowdown' || m === 'duoshowdown' || m === 'trioshowdown'
}

function isTwoTeamMode(mode?: string | null) {
  return !isShowdownMode(mode);
}

function parseIdsCsv(v?: string): number[] {
  if (!v) return []
  return String(v)
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)
}

function uniq3(ids: number[]) {
  return Array.from(new Set(ids)).slice(0, 3)
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x))
}

function logWeight(n: number) {
  // gentle confidence weight: 0..~1
  return Math.log10(n + 1) / 3 // 0..1-ish for 1..1000
}

function betaSmoothWinRate(wins: number, games: number, a = 5, b = 5) {
  // Posterior mean of Beta(a,b) prior with wins/losses evidence
  // games=0 => a/(a+b) = 0.5 when a=b
  const w = Math.max(0, wins || 0)
  const g = Math.max(0, games || 0)
  return (w + a) / (g + a + b)
}

function signedComponentFromWR(wr: number, games: number) {
  // wr: 0..1, games: >=0
  // returns [-1..1] scaled by sample confidence
  const signed = clamp((wr - 0.5) * 2, -1, 1) // -1..1
  return signed * logWeight(games)            // confidence scaling
}

@Controller()
export class AppController {
  constructor(
    @InjectRepository(TrackedPlayerEntity)
    private readonly trackedRepo: Repository<TrackedPlayerEntity>,

    @InjectRepository(BattleTeamPickEntity)
    private readonly picksRepo: Repository<BattleTeamPickEntity>,

    @InjectRepository(BattleEntity)
    private readonly battleRepo: Repository<BattleEntity>,

    @InjectRepository(BrawlerEntity)
    private readonly brawlerRepo: Repository<BrawlerEntity>,

    @InjectRepository(UserProfileEntity)
    private readonly userProfileRepo: Repository<UserProfileEntity>,

    private readonly http: HttpService,

    private readonly collector: CollectorService,
    private readonly authService: AuthService,
  ) { }

  @UseGuards(AdminAccessGuard)
  @Post('/tracked')
  async addTracked(@Body() body: AddTrackedDto) {
    const tag = normTag(body.tag);
    await this.trackedRepo.upsert(
      { tag, name: body.name ?? null, source: 'manual', active: true },
      ['tag'],
    );
    return { ok: true, tag };
  }

  @UseGuards(AdminAccessGuard)
  @Get('/tracked')
  async listTracked() {
    return this.trackedRepo.find();
  }

  @UseGuards(AdminAccessGuard)
  @ApiTags('admin')
  @Post('/admin/collect-now')
  async collectNow() {
    return this.collector.collectNowForAll();
  }

  @ApiTags('brawlers')
  @Get('/brawlers')
  async listBrawlers() {
    const rows = await this.brawlerRepo
      .createQueryBuilder('br')
      .select(['br.id AS id', 'br.name AS name'])
      .orderBy('br.name', 'ASC')
      .getRawMany()

    return {
      items: rows.map(r => ({ id: Number(r.id), name: String(r.name) })),
    }
  }

  @ApiTags('maps')
  @ApiQuery({ name: 'map', required: true })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @ApiQuery({ name: 'ally', required: false, example: '16000000,16000001' })   // ids CSV
  @ApiQuery({ name: 'enemy', required: false, example: '16000010,16000011' })  // ids CSV
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  @Get('/maps/ranked-helper')
  async rankedHelper(
    @Req() req: any,
    @Query('map') map: string,
    @Query('days') days = '7',
    @Query('mode') mode?: string,
    @Query('ally') allyCsv?: string,
    @Query('enemy') enemyCsv?: string,
    @Query('limit') limit = '12',
  ) {
    if (!map) return { error: 'Provide ?map=Hideout' }
    if (mode && isShowdownMode(mode)) {
      return { error: 'Ranked Helper is disabled for showdown (needs 2 teams).' }
    }

    const daysN = Math.max(1, Math.min(30, Number(days) || 7))
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000)
    const lim = Math.max(6, Math.min(30, Number(limit) || 12))

    // tuning
    const PRIOR_A = 5
    const PRIOR_B = 5

    // don’t punish/reward tiny samples for counters/synergy
    const MIN_PAIR_GAMES = 2

    const ally = uniq3(parseIdsCsv(allyCsv))
    const enemy = uniq3(parseIdsCsv(enemyCsv))
    const pickedSet = new Set<number>([...ally, ...enemy])
    const allyNames = ally.map((id) => this.collector.brawlerName(id))
    const enemyNames = enemy.map((id) => this.collector.brawlerName(id))
    let preferredBrawlerIds = new Set<number>()

    try {
      const token = extractBearerToken(req?.headers?.authorization)
      if (token) {
        const sessionUser = await this.authService.verifyAppToken(token)
        const profile = await this.userProfileRepo.findOne({ where: { userId: sessionUser.sub } })
        preferredBrawlerIds = new Set(profile?.preferredBrawlerIds ?? [])
      }
    } catch {
      preferredBrawlerIds = new Set<number>()
    }

    // ---------- build WHERE + base params (ONLY what is needed) ----------
    const whereParts: string[] = []
    const baseParams: any[] = []

    baseParams.push(`%${map.trim()}%`) // $1
    baseParams.push(since)             // $2

    whereParts.push(`b."map" ILIKE $1`)
    whereParts.push(`b."battleTime" >= $2`)
    whereParts.push(`b."category" = 'ranked'`)

    if (mode && mode.trim()) {
      baseParams.push(mode.trim()) // $3
      whereParts.push(`b."mode" = $${baseParams.length}`)
    }

    const whereSql = `WHERE ${whereParts.join('\n  AND ')}`

    // ---------- 1) base map strength (uses ONLY baseParams) ----------
    const baseSql = `
    WITH base AS (
      SELECT b."battleId", b."battleTime", b."result"
      FROM "battles" b
      ${whereSql}
    ),
    pPro AS (
      SELECT p."battleId",
             unnest(array_remove(ARRAY[p."b1",p."b2",p."b3",p."b4",p."b5"], NULL)) AS id
      FROM "battle_team_picks" p
      INNER JOIN base b ON b."battleId" = p."battleId"
      WHERE p."isProSide" = true
        AND p."teamSize" IN (3,5)
    ),
    pEn AS (
      SELECT p."battleId",
             unnest(array_remove(ARRAY[p."b1",p."b2",p."b3",p."b4",p."b5"], NULL)) AS id
      FROM "battle_team_picks" p
      INNER JOIN base b ON b."battleId" = p."battleId"
      WHERE p."isProSide" = false
        AND p."teamSize" IN (3,5)
    ),
    uni AS (
      SELECT p."battleId", p.id, 'pro'::text AS side FROM pPro p
      UNION ALL
      SELECT e."battleId", e.id, 'en'::text  AS side FROM pEn e
    )
    SELECT
      u.id AS "brawlerId",
      COUNT(*)::int AS "picks",
      SUM(
        CASE
          WHEN u.side='pro' AND b."result"='victory' THEN 1
          WHEN u.side='en'  AND b."result"='defeat'  THEN 1
          ELSE 0
        END
      )::int AS "wins",
      MAX(b."battleTime") AS "lastSeen"
    FROM uni u
    INNER JOIN base b ON b."battleId" = u."battleId"
    GROUP BY u.id
  `

    const baseRows = await this.battleRepo.query(baseSql, baseParams)

    // ---------- 2) counters vs enemy (ONLY if enemy provided) ----------
    const counterByCand = new Map<number, Array<{ enemyId: number; games: number; wins: number; lastSeen: any }>>()

    if (enemy.length) {
      const counterParams = [...baseParams, enemy]
      const enemyIdx = counterParams.length // last param index for $N

      const counterSql = `
      WITH base AS (
        SELECT b."battleId", b."battleTime", b."result"
        FROM "battles" b
        ${whereSql}
      ),
      pro_ids AS (
        SELECT p."battleId",
               unnest(array_remove(ARRAY[p."b1",p."b2",p."b3",p."b4",p."b5"], NULL)) AS "proId"
        FROM "battle_team_picks" p
        INNER JOIN base b ON b."battleId" = p."battleId"
        WHERE p."isProSide" = true AND p."teamSize" IN (3,5)
      ),
      en_ids AS (
        SELECT p."battleId",
               unnest(array_remove(ARRAY[p."b1",p."b2",p."b3",p."b4",p."b5"], NULL)) AS "enemyId"
        FROM "battle_team_picks" p
        INNER JOIN base b ON b."battleId" = p."battleId"
        WHERE p."isProSide" = false AND p."teamSize" IN (3,5)
      )
      SELECT
        p."proId" AS "brawlerId",
        e."enemyId" AS "enemyId",
        COUNT(*)::int AS "games",
        SUM(CASE WHEN b."result"='victory' THEN 1 ELSE 0 END)::int AS "wins",
        MAX(b."battleTime") AS "lastSeen"
      FROM pro_ids p
      INNER JOIN en_ids e ON e."battleId" = p."battleId"
      INNER JOIN base b ON b."battleId" = p."battleId"
      WHERE e."enemyId" = ANY($${enemyIdx}::int[])
      GROUP BY p."proId", e."enemyId"
    `

      const counterRows = await this.battleRepo.query(counterSql, counterParams)

      for (const r of counterRows) {
        const cand = Number(r.brawlerId)
        const enemyId = Number(r.enemyId)
        const games = Number(r.games) || 0
        const wins = Number(r.wins) || 0
        if (!counterByCand.has(cand)) counterByCand.set(cand, [])
        counterByCand.get(cand)!.push({ enemyId, games, wins, lastSeen: r.lastSeen })
      }
    }

    // ---------- 3) synergy with allies (ONLY if ally provided) ----------
    const synergyByCand = new Map<number, Array<{ mateId: number; games: number; wins: number; lastSeen: any }>>()

    if (ally.length) {
      const synergyParams = [...baseParams, ally]
      const allyIdx = synergyParams.length

      const synergySql = `
      WITH base AS (
        SELECT b."battleId", b."battleTime", b."result"
        FROM "battles" b
        ${whereSql}
      ),
      pro_ids AS (
        SELECT p."battleId",
               unnest(array_remove(ARRAY[p."b1",p."b2",p."b3",p."b4",p."b5"], NULL)) AS "proId"
        FROM "battle_team_picks" p
        INNER JOIN base b ON b."battleId" = p."battleId"
        WHERE p."isProSide" = true AND p."teamSize" IN (3,5)
      )
      SELECT
        c."proId" AS "brawlerId",
        m."proId" AS "mateId",
        COUNT(*)::int AS "games",
        SUM(CASE WHEN b."result"='victory' THEN 1 ELSE 0 END)::int AS "wins",
        MAX(b."battleTime") AS "lastSeen"
      FROM pro_ids c
      INNER JOIN pro_ids m
        ON m."battleId" = c."battleId" AND m."proId" <> c."proId"
      INNER JOIN base b ON b."battleId" = c."battleId"
      WHERE m."proId" = ANY($${allyIdx}::int[])
      GROUP BY c."proId", m."proId"
    `

      const synergyRows = await this.battleRepo.query(synergySql, synergyParams)

      for (const r of synergyRows) {
        const cand = Number(r.brawlerId)
        const mateId = Number(r.mateId)
        const games = Number(r.games) || 0
        const wins = Number(r.wins) || 0
        if (!synergyByCand.has(cand)) synergyByCand.set(cand, [])
        synergyByCand.get(cand)!.push({ mateId, games, wins, lastSeen: r.lastSeen })
      }
    }

    // ---------- scoring ----------
    const items: any[] = []

    for (const r of baseRows) {
      const id = Number(r.brawlerId)
      if (!Number.isFinite(id)) continue
      if (pickedSet.has(id)) continue

      const picks = Number(r.picks) || 0
      const wins = Number(r.wins) || 0
      const wrRaw = picks ? wins / picks : 0
      const wr = betaSmoothWinRate(wins, picks, PRIOR_A, PRIOR_B)
      const baseComp = signedComponentFromWR(wr, picks)

      // counters (positive only)
      // counters (positive + negative)
      let counterComp = 0
      let counterDetailsPos: any[] = []
      let counterDetailsNeg: any[] = []

      if (enemy.length) {
        const arr = (counterByCand.get(id) ?? [])
          .map(x => {
            const wrRaw = x.games ? x.wins / x.games : 0
            const wrSm = betaSmoothWinRate(x.wins, x.games, PRIOR_A, PRIOR_B)
            const comp = signedComponentFromWR(wrSm, x.games)
            return { ...x, winRate: wrRaw, winRateSmoothed: wrSm, component: comp }
          })
          .filter(x => x.games >= MIN_PAIR_GAMES)

        if (arr.length) {
          // aggregate: mean of signed components (includes negative penalties)
          counterComp = arr.reduce((s, x) => s + x.component, 0) / arr.length

          // top positives
          counterDetailsPos = arr
            .filter(x => x.component > 0)
            .sort((a, b) => (b.component - a.component) || (b.games - a.games))
            .slice(0, 3)
            .map(x => ({
              enemyBrawlerId: x.enemyId,
              enemyBrawler: this.collector.brawlerName(x.enemyId),
              games: x.games,
              wins: x.wins,
              winRate: x.winRate,
              winRateSmoothed: x.winRateSmoothed,
              component: x.component,
            }))

          // top negatives (penalties)
          counterDetailsNeg = arr
            .filter(x => x.component < 0)
            .sort((a, b) => (a.component - b.component) || (b.games - a.games)) // most negative first
            .slice(0, 3)
            .map(x => ({
              enemyBrawlerId: x.enemyId,
              enemyBrawler: this.collector.brawlerName(x.enemyId),
              games: x.games,
              wins: x.wins,
              winRate: x.winRate,
              winRateSmoothed: x.winRateSmoothed,
              component: x.component,
            }))
        }
      }

      // synergy (positive only)
      // synergy (positive + negative)
      let synergyComp = 0
      let synergyDetailsPos: any[] = []
      let synergyDetailsNeg: any[] = []

      if (ally.length) {
        const arr = (synergyByCand.get(id) ?? [])
          .map(x => {
            const wrRaw = x.games ? x.wins / x.games : 0
            const wrSm = betaSmoothWinRate(x.wins, x.games, PRIOR_A, PRIOR_B)
            const comp = signedComponentFromWR(wrSm, x.games)
            return { ...x, winRate: wrRaw, winRateSmoothed: wrSm, component: comp }
          })
          .filter(x => x.games >= MIN_PAIR_GAMES)

        if (arr.length) {
          synergyComp = arr.reduce((s, x) => s + x.component, 0) / arr.length

          synergyDetailsPos = arr
            .filter(x => x.component > 0)
            .sort((a, b) => (b.component - a.component) || (b.games - a.games))
            .slice(0, 2)
            .map(x => ({
              mateBrawlerId: x.mateId,
              mateBrawler: this.collector.brawlerName(x.mateId),
              games: x.games,
              wins: x.wins,
              winRate: x.winRate,
              winRateSmoothed: x.winRateSmoothed,
              component: x.component,
            }))

          synergyDetailsNeg = arr
            .filter(x => x.component < 0)
            .sort((a, b) => (a.component - b.component) || (b.games - a.games))
            .slice(0, 2)
            .map(x => ({
              mateBrawlerId: x.mateId,
              mateBrawler: this.collector.brawlerName(x.mateId),
              games: x.games,
              wins: x.wins,
              winRate: x.winRate,
              winRateSmoothed: x.winRateSmoothed,
              component: x.component,
            }))
        }
      }

      const candidateName = this.collector.brawlerName(id)
      const draft = scoreDraftFit(classificationForName(candidateName), allyNames, enemyNames)
      const draftComp =
        draft.score.roleNeed +
        draft.score.flexibility +
        draft.score.traitMatchup +
        draft.score.risk
      const preferredBoost = preferredBrawlerIds.has(id) ? 0.08 : 0

      const score =
        0.34 * baseComp +
        0.22 * counterComp +
        0.14 * synergyComp +
        0.30 * draftComp +
        preferredBoost

      items.push({
        brawlerId: id,
        brawler: candidateName,
        score,
        base: { picks, wins, winRate: wrRaw, winRateSmoothed: wr, component: baseComp },
        counters: {
          positive: counterDetailsPos,
          negative: counterDetailsNeg,
          component: counterComp,
        },
        synergies: {
          positive: synergyDetailsPos,
          negative: synergyDetailsNeg,
          component: synergyComp,
        },
        draft: {
          component: draftComp,
          roleNeed: draft.score.roleNeed,
          flexibility: draft.score.flexibility,
          traitMatchup: draft.score.traitMatchup,
          risk: draft.score.risk,
          reasons: draft.reasons,
        },
        userPreference: {
          preferred: preferredBoost > 0,
          boost: preferredBoost,
        },
        lastSeen: r.lastSeen,
      })
    }

    items.sort((a, b) => (b.score - a.score) || ((b.base?.picks ?? 0) - (a.base?.picks ?? 0)))

    return {
      map,
      since,
      category: 'ranked',
      mode: mode?.trim() || null,
      ally,
      enemy,
      weights: { base: 0.34, counters: 0.22, synergies: 0.14, draft: 0.30 },
      items: items.slice(0, lim),
    }
  }

  @ApiQuery({ name: 'map', required: true, example: 'Hideout' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'category', required: false, enum: ['ranked', 'ladder', 'all'] })
  @ApiQuery({ name: 'playerTag', required: false, example: '#8J2LQ9RP' })
  @ApiQuery({ name: 'perspective', required: false, enum: ['pro', 'enemy', 'all'] })
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @Get('/maps/top-comps')
  async topComps(
    @Query('map') map: string,
    @Query('days') days = '7',
    @Query('category') category: 'ranked' | 'ladder' | 'special' | 'all',
    @Query('playerTag') playerTag?: string,
    @Query('perspective') perspective: 'pro' | 'enemy' | 'all' = 'all',
    @Query('mode') mode?: string,
  ) {
    if (!map) return { error: 'Provide ?map=Hideout' };
    if (mode && ['soloshowdown', 'duoshowdown', 'trioshowdown'].includes(mode.trim().toLowerCase())) {
      return { error: 'Matchups are disabled for showdown. Use /maps/top-comps instead.' };
    }

    const daysN = Math.max(1, Math.min(30, Number(days) || 7));
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000);

    const qb = this.picksRepo
      .createQueryBuilder('p')
      .innerJoin(BattleEntity, 'b', 'b.battleId = p.battleId')
      .select('p.compKey', 'compKey')
      .addSelect('COUNT(*)', 'picks')
      .addSelect(`SUM(CASE WHEN b.result = 'victory' THEN 1 ELSE 0 END)`, 'wins')
      .addSelect('MAX(b.battleTime)', 'lastSeen')
      .where('b.map ILIKE :map', { map: `%${map.trim()}%` })
      .andWhere('b.battleTime >= :since', { since });

    if (category !== 'all') {
      qb.andWhere('b.category = :category', { category });
    }

    if (mode && mode.trim()) {
      qb.andWhere('b.mode = :mode', { mode: mode.trim() });
    }

    if (perspective === 'pro') qb.andWhere('p.isProSide = true');
    if (perspective === 'enemy') qb.andWhere('p.isProSide = false');

    if (playerTag) {
      qb.andWhere('b.observedFromTag = :pt', { pt: normTag(playerTag) });
    }

    const rows = await qb
      .groupBy('p.compKey')
      .orderBy('picks', 'DESC')
      .limit(20)
      .getRawMany();

    const allIds = new Set<number>();
    for (const r of rows) {
      for (const id of compKeyToIds(r.compKey)) allIds.add(id);
    }

    const items = rows.map(r => {
      const ids = compKeyToIds(r.compKey);
      const names = this.collector.brawlerNames(ids);

      return {
        compKey: r.compKey,
        brawlers: names,
        brawlerIds: ids,
        picks: Number(r.picks),
        wins: Number(r.wins),
        winRate: Number(r.picks) ? Number(r.wins) / Number(r.picks) : 0,
        lastSeen: r.lastSeen,
      };
    });

    return {
      map,
      since,
      category,
      items,
    };
  }

  @UseGuards(AdminAccessGuard)
  @ApiTags('admin')
  @ApiQuery({ name: 'country', required: false, example: 'global' })
  @ApiQuery({ name: 'limit', required: false, example: 200 })
  @ApiQuery({ name: 'replaceActive', required: false, example: false })
  @Post('/admin/load-top')
  async loadTop(
    @Query('country') country = 'global',
    @Query('limit') limit = '200',
    @Query('replaceActive') replaceActive = 'false',
  ) {
    const rep = String(replaceActive).toLowerCase() === 'true';
    return this.collector.loadTopPlayers(country, Number(limit), rep);
  }

  @UseGuards(AdminAccessGuard)
  @ApiTags('tracked')
  @ApiBody({ type: DisableTrackedDto })
  @Post('/tracked/disable')
  async disableTracked(@Body() body: DisableTrackedDto) {
    const tag = normTag(body.tag);

    await this.trackedRepo.update({ tag }, { active: false });

    // optional: tell if it existed
    const row = await this.trackedRepo.findOne({ where: { tag } });
    return { ok: true, tag, active: row?.active ?? null };
  }

  @UseGuards(AdminAccessGuard)
  @ApiTags('tracked')
  @ApiBody({ type: DisableTrackedDto })
  @Post('/tracked/enable')
  async enableTracked(@Body() body: DisableTrackedDto) {
    const tag = normTag(body.tag);

    await this.trackedRepo.update({ tag }, { active: true });

    const row = await this.trackedRepo.findOne({ where: { tag } });
    return { ok: true, tag, active: row?.active ?? null };
  }

  @ApiTags('maps')
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'category', required: false, enum: ['ranked', 'ladder', 'all'] })
  @Get('/maps')
  async listMaps(
    @Query('days') days = '7',
    @Query('category') category: 'ranked' | 'ladder' | 'special' | 'all',
    @Query('mode') mode?: string,
  ) {
    const daysN = Math.max(1, Math.min(30, Number(days) || 7));
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000);

    const qb = this.battleRepo
      .createQueryBuilder('b')
      .select('b.map', 'map')
      .addSelect('b.mode', 'mode') 
      .groupBy('b.map')
      .addGroupBy('b.mode')
      .addSelect('COUNT(*)', 'battles')
      .addSelect('MAX(b.battleTime)', 'lastSeen')
      .where('b.battleTime >= :since', { since });

    if (category !== 'all') {
      qb.andWhere('b.category = :category', { category });
    }

    if (mode && mode.trim()) {
      qb.andWhere('b.mode = :mode', { mode: mode.trim() }); // ✅ filter by mode
    }

    const rows = await qb
      .orderBy('battles', 'DESC')
      .limit(100)
      .getRawMany();

    return {
      since,
      category,
      items: rows.map(r => ({
        map: r.map,
        mode: r.mode,
        battles: Number(r.battles),
        lastSeen: r.lastSeen,
      })),
    };
  }

  @UseGuards(AdminAccessGuard)
  @ApiTags('admin')
  @ApiQuery({ name: 'clubTag', required: true, example: '#2PPU0G8' })
  @ApiQuery({ name: 'replaceActive', required: false, example: false })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @Post('/admin/import-club')
  async importClub(
    @Query('clubTag') clubTag: string,
    @Query('replaceActive') replaceActive = 'false',
    @Query('limit') limit = '30',
  ) {
    if (!clubTag) return { error: 'Provide ?clubTag=#XXXX' };

    const token = process.env.BRAWL_API_TOKEN;
    const base = process.env.BRAWL_API_BASE_URL ?? 'https://api.brawlstars.com/v1';
    if (!token) return { error: 'BRAWL_API_TOKEN is not set' };

    const rep = String(replaceActive).toLowerCase() === 'true';
    const lim = Math.max(1, Math.min(200, Number(limit) || 30));

    const tag = normTag(clubTag);              // "#ABC..."
    const enc = `%23${tag.replace('#', '')}`;  // "%23ABC..."

    if (rep) {
      await this.trackedRepo.update({}, { active: false });
    }

    const url = `${base}/clubs/${enc}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15_000,
    });

    const members: any[] = Array.isArray(res.data?.members) ? res.data.members : [];
    const take = members.slice(0, lim);

    let imported = 0;

    for (const m of take) {
      const mTag = normTag(m?.tag);
      const name = typeof m?.name === 'string' ? m.name : null;
      if (!mTag) continue;

      await this.trackedRepo.upsert(
        { tag: mTag, name, source: 'club', active: true },
        ['tag'],
      );

      imported++;
    }

    return {
      ok: true,
      clubTag: tag,
      clubName: res.data?.name ?? null,
      membersFound: members.length,
      imported,
      replaceActive: rep,
      limit: lim,
    };
  }

  @ApiTags('debug')
  @ApiQuery({ name: 'tag', required: true, example: '8J2LQ9RP' })
  @Get('/battlelog')
  async battlelog(@Query('tag') tag: string) {
    if (!tag) return { error: 'Provide ?tag=8J2LQ9RP' };

    const clean = normTag(tag);
    const token = process.env.BRAWL_API_TOKEN;
    const base = process.env.BRAWL_API_BASE_URL ?? 'https://api.brawlstars.com/v1';

    if (!token) return { error: 'BRAWL_API_TOKEN is not set' };

    const url = `${base}/players/${encodeURIComponent(clean)}/battlelog`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return res.data; // raw JSON from Supercell
    } catch (e: any) {
      // forward useful error
      const status = e?.response?.status ?? 500;
      const data = e?.response?.data ?? { message: e?.message ?? 'unknown error' };
      return { status, error: data };
    }
  }

  @ApiTags('maps')
  @ApiQuery({ name: 'map', required: true, example: 'Hideout' })
  @ApiQuery({ name: 'days', required: false, example: 14 })
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @ApiQuery({ name: 'minGames', required: false, example: 10 })
  @ApiQuery({ name: 'limitPairs', required: false, example: 400 })
  @Get('/maps/analyzer')
  async analyzer(
    @Query('map') map: string,
    @Query('days') days = '14',
    @Query('mode') mode?: string,
    @Query('minGames') minGames = '10',
    @Query('limitPairs') limitPairs = '400',
  ) {
    if (!map) return { error: 'Provide ?map=Hideout' }
    if (mode && isShowdownMode(mode)) {
      return { error: 'Analyzer is disabled for showdown (needs 2 teams).' }
    }

    const daysN = Math.max(1, Math.min(30, Number(days) || 14))
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000)

    const minN = Math.max(2, Math.min(200, Number(minGames) || 10))
    const lim = Math.max(50, Math.min(2000, Number(limitPairs) || 400))

    // params: $1 mapLike, $2 since, (optional $3 mode), then minGames, limit
    const params: any[] = []
    params.push(`%${map.trim()}%`) // $1
    params.push(since)             // $2

    let whereExtra = ` AND b."category" = 'ranked' `
    if (mode && mode.trim()) {
      params.push(mode.trim())
      whereExtra += ` AND b."mode" = $${params.length} `
    }

    // now push minGames + limit as parameters (safe)
    const minParam = params.length + 1
    params.push(minN)

    const limParam = params.length + 1
    params.push(lim)

    const sql = `
    WITH base AS (
      SELECT
        b."battleId" AS "battleId",
        b."battleTime" AS "battleTime",
        b."result" AS "result",
        pPro."b1" AS pb1, pPro."b2" AS pb2, pPro."b3" AS pb3, pPro."b4" AS pb4, pPro."b5" AS pb5,
        pEn."b1"  AS eb1, pEn."b2"  AS eb2, pEn."b3"  AS eb3, pEn."b4"  AS eb4, pEn."b5"  AS eb5
      FROM "battles" b
      INNER JOIN "battle_team_picks" pPro
        ON pPro."battleId" = b."battleId" AND pPro."isProSide" = true
      INNER JOIN "battle_team_picks" pEn
        ON pEn."battleId" = b."battleId" AND pEn."isProSide" = false
      WHERE b."map" ILIKE $1
        AND b."battleTime" >= $2
        ${whereExtra}
        AND pPro."teamSize" IN (3,5)
        AND pEn."teamSize"  IN (3,5)
    ),
    pro_ids AS (
      SELECT
        "battleId",
        unnest(array_remove(ARRAY[pb1,pb2,pb3,pb4,pb5], NULL)) AS "proId"
      FROM base
    ),
    en_ids AS (
      SELECT
        "battleId",
        unnest(array_remove(ARRAY[eb1,eb2,eb3,eb4,eb5], NULL)) AS "enemyId"
      FROM base
    ),
    pairs AS (
      SELECT
        p."proId" AS "proId",
        e."enemyId" AS "enemyId",
        b."battleTime" AS "battleTime",
        b."result" AS "result"
      FROM pro_ids p
      INNER JOIN en_ids e ON e."battleId" = p."battleId"
      INNER JOIN base b   ON b."battleId" = p."battleId"
    )
    SELECT
      "proId",
      "enemyId",
      COUNT(*)::int AS games,
      SUM(CASE WHEN "result" = 'victory' THEN 1 ELSE 0 END)::int AS wins,
      MAX("battleTime") AS "lastSeen"
    FROM pairs
    GROUP BY "proId", "enemyId"
    HAVING COUNT(*) >= $${minParam}
    ORDER BY games DESC
    LIMIT $${limParam};
  `

    const raw: Array<{ proId: number; enemyId: number; games: number; wins: number; lastSeen: string | Date }> =
      await this.battleRepo.query(sql, params)

    // group -> response
    const byPro: Record<string, { brawlerId: number; brawler: string; vs: any[] }> = {}

    for (const r of raw) {
      const proId = Number(r.proId)
      const enemyId = Number(r.enemyId)
      const games = Number(r.games) || 0
      const wins = Number(r.wins) || 0
      const winRate = games ? wins / games : 0

      // only positive (> 50%) as requested
      if (winRate <= 0.5) continue

      const key = String(proId)
      if (!byPro[key]) {
        byPro[key] = {
          brawlerId: proId,
          brawler: this.collector.brawlerName(proId),
          vs: [],
        }
      }

      byPro[key].vs.push({
        enemyBrawlerId: enemyId,
        enemyBrawler: this.collector.brawlerName(enemyId),
        games,
        wins,
        winRate,
        lastSeen: r.lastSeen,
      })
    }

    const items = Object.values(byPro).map((x) => {
      x.vs.sort((a, b) => (b.winRate - a.winRate) || (b.games - a.games))
      return x
    })

    items.sort((a, b) => {
      const aw = a.vs?.[0]?.winRate ?? 0
      const bw = b.vs?.[0]?.winRate ?? 0
      const ag = a.vs?.[0]?.games ?? 0
      const bg = b.vs?.[0]?.games ?? 0
      return (bw - aw) || (bg - ag)
    })

    return {
      map,
      since,
      category: 'ranked',
      mode: mode?.trim() || null,
      minGames: minN,
      limitPairs: lim,
      items,
    }
  }

  @ApiTags('maps')
  @ApiQuery({ name: 'map', required: true, example: 'Hideout' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  @ApiQuery({ name: 'category', required: false, enum: ['ranked', 'ladder', 'special', 'all'] })
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @Get('/maps/best-brawlers')
  async bestBrawlers(
    @Query('map') map: string,
    @Query('days') days = '7',
    @Query('category') category: 'ranked' | 'ladder' | 'special' | 'all' = 'all',
    @Query('mode') mode?: string,
    @Query('limit') limit = '30',
  ) {
    if (!map) return { error: 'Provide ?map=Hideout' };

    const daysN = Math.max(1, Math.min(30, Number(days) || 7));
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000);
    const lim = Math.max(1, Math.min(100, Number(limit) || 30));

    // if user requests showdown mode explicitly -> allow, but it will still work (it’s just solo/duo/trio)
    // Your requirement: best brawlers is useful for showdown too, so we DO NOT block showdown here.

    // IMPORTANT:
    // BattleEntity.result is from observedFromTag (pro) perspective.
    // So "global win" for a picked side is:
    //   - if pick isProSide=true  -> win when result='victory'
    //   - if pick isProSide=false -> win when result='defeat'  (pro lost, enemy side won)
    // draw -> 0 wins (keeps it simple)

    const params: any[] = [];
    params.push(`%${map.trim()}%`); // $1 map ilike
    params.push(since);             // $2 since

    let whereExtra = '';
    if (category !== 'all') {
      params.push(category); // $3
      whereExtra += ` AND b."category" = $${params.length}`;
    }
    if (mode && mode.trim()) {
      params.push(mode.trim()); // next
      whereExtra += ` AND b."mode" = $${params.length}`;
    }

    // Use LATERAL unnest to expand b1..b5 to individual brawler ids.
    const sql = `
      WITH rows AS (
        SELECT
          bid AS "brawlerId",
          COUNT(*)::int AS "picks",
          SUM(
            CASE
              WHEN p."isProSide" = true  AND b."result" = 'victory' THEN 1
              WHEN p."isProSide" = false AND b."result" = 'defeat'  THEN 1
              ELSE 0
            END
          )::int AS "wins",
          MAX(b."battleTime") AS "lastSeen"
        FROM "battle_team_picks" p
        INNER JOIN "battles" b ON b."battleId" = p."battleId"
        CROSS JOIN LATERAL unnest(ARRAY[p."b1", p."b2", p."b3", p."b4", p."b5"]) AS bid
        WHERE bid IS NOT NULL
          AND b."map" ILIKE $1
          AND b."battleTime" >= $2
          ${whereExtra}
        GROUP BY bid
      )
      SELECT
        r.*,
        SUM(r."picks") OVER ()::int AS "totalPicks"
      FROM rows r
      ORDER BY r."picks" DESC
      LIMIT ${lim};
    `;

    const raw = await this.picksRepo.query(sql, params);

    const items = raw.map((r: any) => {
      const picks = Number(r.picks) || 0;
      const wins = Number(r.wins) || 0;
      const totalPicks = Number(r.totalPicks) || 0;

      const brawlerId = Number(r.brawlerId);
      return {
        brawlerId,
        brawler: this.collector.brawlerName(brawlerId),
        picks,
        wins,
        winRate: picks ? wins / picks : 0,
        pickRate: totalPicks ? picks / totalPicks : 0,
        lastSeen: r.lastSeen,
      };
    });

    return { map, since, category, mode: mode ?? null, items };
  }

  @ApiQuery({ name: 'playerTag', required: false, example: '#8J2LQ9RP' })
  @ApiQuery({ name: 'mode', required: false, example: 'brawlBall' })
  @Get('/maps/matchups')
  async matchups(
    @Query('map') map: string,
    @Query('days') days = '7',
    @Query('category') category: 'ranked' | 'ladder' | 'special' | 'all',
    @Query('playerTag') playerTag?: string,
    @Query('mode') mode?: string,
  ) {
    if (!map) return { error: 'Provide ?map=Hideout' };

    const daysN = Math.max(1, Math.min(30, Number(days) || 7));
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000);

    const qb = this.battleRepo
      .createQueryBuilder('b')
      .innerJoin(BattleTeamPickEntity, 'pPro', 'pPro.battleId = b.battleId AND pPro.isProSide = true')
      .innerJoin(BattleTeamPickEntity, 'pEn', 'pEn.battleId = b.battleId AND pEn.isProSide = false')
      .select('pPro.compKey', 'proCompKey')
      .addSelect('pEn.compKey', 'enemyCompKey')
      .addSelect('COUNT(*)', 'games')
      .addSelect(`SUM(CASE WHEN b.result = 'victory' THEN 1 ELSE 0 END)`, 'proWins')
      .addSelect(`SUM(CASE WHEN b.result = 'defeat' THEN 1 ELSE 0 END)`, 'proLosses')
      .addSelect(`SUM(CASE WHEN b.result = 'draw' THEN 1 ELSE 0 END)`, 'draws')
      .addSelect('MAX(b.battleTime)', 'lastSeen')
      .where('b.map ILIKE :map', { map: `%${map.trim()}%` })
      .andWhere('b.battleTime >= :since', { since });

    qb.andWhere('pPro.teamSize IN (3, 5)');
    qb.andWhere('pEn.teamSize IN (3, 5)');

    if (category !== 'all') {
      qb.andWhere('b.category = :category', { category });
    }

    if (playerTag) {
      qb.andWhere('b.observedFromTag = :pt', { pt: normTag(playerTag) });
    }

    if (mode && mode.trim()) {
      qb.andWhere('b.mode = :mode', { mode: mode.trim() });
    }

    const rows = await qb
      .groupBy('pPro.compKey')
      .addGroupBy('pEn.compKey')
      .orderBy('games', 'DESC')
      .limit(50)
      .getRawMany();

    // helper inside method (no extra file needed)
    const compKeyToIds = (compKey: string): number[] =>
      String(compKey).split('-').map(Number).filter(n => !Number.isNaN(n));

    // collect all brawler ids from both sides
    const allIds = new Set<number>();
    for (const r of rows) {
      for (const id of compKeyToIds(r.proCompKey)) allIds.add(id);
      for (const id of compKeyToIds(r.enemyCompKey)) allIds.add(id);
    }

    return {
      map,
      since,
      category,
      items: rows.map(r => {
        const proIds = compKeyToIds(r.proCompKey);
        const enemyIds = compKeyToIds(r.enemyCompKey);

        const proNames = this.collector.brawlerNames(proIds);
        const enemyNames = this.collector.brawlerNames(enemyIds);

        const games = Number(r.games);
        const proWins = Number(r.proWins);

        return {
          proCompKey: r.proCompKey,
          proBrawlers: proNames,
          proBrawlerIds: proIds,

          enemyCompKey: r.enemyCompKey,
          enemyBrawlers: enemyNames,
          enemyBrawlerIds: enemyIds,

          games,
          proWins,
          proLosses: Number(r.proLosses),
          draws: Number(r.draws),
          winRate: games ? proWins / games : 0,
          lastSeen: r.lastSeen,
        };
      }),
    };
  }
}
