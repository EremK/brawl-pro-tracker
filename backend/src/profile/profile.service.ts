import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../db/entities/user-profile.entity';
import { UserBattleEntity } from '../db/entities/user-battle.entity';
import { UserBattlePickEntity } from '../db/entities/user-battle-pick.entity';
import { CollectorService } from '../collector/collector.service';

type AppUser = {
  sub: string;
  email: string;
  name: string | null;
  admin: boolean;
};

type ProfileCategory = 'ranked' | 'ladder' | 'all';

function normTag(tag: string) {
  const t = String(tag ?? '').trim().toUpperCase();
  return t.startsWith('#') ? t : `#${t}`;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profiles: Repository<UserProfileEntity>,
    @InjectRepository(UserBattleEntity)
    private readonly userBattles: Repository<UserBattleEntity>,
    @InjectRepository(UserBattlePickEntity)
    private readonly userPicks: Repository<UserBattlePickEntity>,
    private readonly collector: CollectorService,
  ) {}

  private sinceFromDays(days: number) {
    const safeDays = Math.max(1, Math.min(90, Number(days) || 30));
    return {
      days: safeDays,
      since: new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000),
    };
  }

  private applyCategory<T extends { where: (sql: string, params?: any) => T; andWhere: (sql: string, params?: any) => T }>(
    qb: T,
    category: ProfileCategory,
  ) {
    if (category !== 'all') {
      qb.andWhere('b.category = :category', { category });
    }
    return qb;
  }

  async getOrCreateProfile(user: AppUser) {
    let profile = await this.profiles.findOne({ where: { userId: user.sub } });
    if (!profile) {
      profile = await this.profiles.save(
        this.profiles.create({
          userId: user.sub,
          playerTag: null,
          playerName: user.name ?? null,
          profileIconId: null,
          clubName: null,
          trophies: null,
          victories3v3: null,
          preferredDays: null,
          preferredBrawlerIds: [],
          lastSyncedAt: null,
        }),
      );
    }

    return profile;
  }

  async getProfile(user: AppUser) {
    return this.getOrCreateProfile(user);
  }

  async saveSettings(
    user: AppUser,
    preferredDays: number | null | undefined,
    preferredBrawlerIds: number[] | null | undefined,
  ) {
    const profile = await this.getOrCreateProfile(user);

    if (preferredDays === null) {
      profile.preferredDays = null;
    } else if (preferredDays !== undefined) {
      const safe = Math.max(7, Math.min(60, Number(preferredDays) || 30));
      profile.preferredDays = safe;
    }

    if (preferredBrawlerIds === null) {
      profile.preferredBrawlerIds = [];
    } else if (preferredBrawlerIds !== undefined) {
      const safeIds = Array.from(
        new Set(
          (Array.isArray(preferredBrawlerIds) ? preferredBrawlerIds : [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      ).slice(0, 10);
      profile.preferredBrawlerIds = safeIds;
    }

    return this.profiles.save(profile);
  }

  async setPlayerTag(user: AppUser, tag: string) {
    const cleanTag = normTag(tag);
    if (cleanTag === '#') {
      throw new BadRequestException('Player tag is required');
    }

    const profile = await this.getOrCreateProfile(user);
    profile.playerTag = cleanTag;
    await this.profiles.save(profile);

    await this.syncProfile(user);
    return this.getProfile(user);
  }

  async syncProfile(user: AppUser) {
    const profile = await this.getOrCreateProfile(user);
    if (!profile.playerTag) {
      throw new BadRequestException('Set your player tag first');
    }

    const result = await this.collector.syncUserProfileBattles(
      user.sub,
      profile.playerTag,
    );

    profile.lastSyncedAt = new Date();
    if (result.playerName) {
      profile.playerName = result.playerName;
    }
    profile.profileIconId = result.profileIconId;
    profile.clubName = result.clubName;
    profile.trophies = result.trophies;
    profile.victories3v3 = result.victories3v3;
    await this.profiles.save(profile);

    return {
      ok: true,
      playerTag: profile.playerTag,
      playerName: profile.playerName,
      profileIconId: profile.profileIconId,
      clubName: profile.clubName,
      trophies: profile.trophies,
      victories3v3: profile.victories3v3,
      processed: result.processed,
      lastSyncedAt: profile.lastSyncedAt,
    };
  }

  async bestModes(user: AppUser, days = 30, category: ProfileCategory = 'all') {
    const { since } = this.sinceFromDays(days);

    const qb = this.userBattles
      .createQueryBuilder('b')
      .select('b.category', 'category')
      .addSelect('b.mode', 'mode')
      .addSelect('COUNT(*)', 'battles')
      .addSelect(
        `SUM(CASE WHEN b.result = 'victory' THEN 1 ELSE 0 END)`,
        'wins',
      )
      .addSelect('MAX(b.battleTime)', 'lastSeen')
      .where('b.userId = :userId', { userId: user.sub })
      .andWhere('b.battleTime >= :since', { since });

    this.applyCategory(qb, category);

    const rows = await qb
      .groupBy('b.category')
      .addGroupBy('b.mode')
      .orderBy('wins', 'DESC')
      .addOrderBy('battles', 'DESC')
      .getRawMany();

    return {
      since,
      category,
      items: rows.map((r) => {
        const battles = Number(r.battles) || 0;
        const wins = Number(r.wins) || 0;
        return {
          category: r.category,
          mode: r.mode,
          battles,
          wins,
          winRate: battles ? wins / battles : 0,
          lastSeen: r.lastSeen,
        };
      }),
    };
  }

  async bestBrawlers(
    user: AppUser,
    days = 30,
    category: ProfileCategory = 'all',
    limit = 24,
  ) {
    const { since } = this.sinceFromDays(days);
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 24));

    const params: any[] = [user.sub, since];
    let whereExtra = '';

    if (category !== 'all') {
      params.push(category);
      whereExtra += ` AND b."category" = $${params.length}`;
    }

    const sql = `
      WITH rows AS (
        SELECT
          b."userBrawlerId" AS "brawlerId",
          COUNT(*)::int AS "picks",
          SUM(CASE WHEN b."result" = 'victory' THEN 1 ELSE 0 END)::int AS "wins",
          MAX(b."battleTime") AS "lastSeen"
        FROM "user_battles" b
        WHERE b."userId" = $1
          AND b."battleTime" >= $2
          AND b."userBrawlerId" IS NOT NULL
          ${whereExtra}
        GROUP BY b."userBrawlerId"
      )
      SELECT *
      FROM rows
      ORDER BY "wins" DESC, "picks" DESC
      LIMIT ${safeLimit};
    `;

    const rows = await this.userBattles.query(sql, params);
    return {
      since,
      category,
      items: rows.map((r: any) => {
        const picks = Number(r.picks) || 0;
        const wins = Number(r.wins) || 0;
        const brawlerId = Number(r.brawlerId);
        return {
          brawlerId,
          brawler: this.collector.brawlerName(brawlerId),
          picks,
          wins,
          winRate: picks ? wins / picks : 0,
          lastSeen: r.lastSeen,
        };
      }),
    };
  }

  async personalMaps(
    user: AppUser,
    days = 60,
    category: ProfileCategory = 'all',
  ) {
    const { since } = this.sinceFromDays(days);

    const qb = this.userBattles
      .createQueryBuilder('b')
      .select('b.map', 'map')
      .addSelect('b.mode', 'mode')
      .addSelect('COUNT(*)', 'battles')
      .addSelect('MAX(b.battleTime)', 'lastSeen')
      .where('b.userId = :userId', { userId: user.sub })
      .andWhere('b.battleTime >= :since', { since });

    this.applyCategory(qb, category);

    const rows = await qb
      .groupBy('b.map')
      .addGroupBy('b.mode')
      .orderBy('battles', 'DESC')
      .getRawMany();

    return {
      since,
      category,
      items: rows.map((r) => ({
        map: r.map,
        mode: r.mode,
        battles: Number(r.battles) || 0,
        lastSeen: r.lastSeen,
      })),
    };
  }

  async bestBrawlersByMap(
    user: AppUser,
    map: string,
    days = 60,
    category: ProfileCategory = 'ranked',
    mode?: string,
    limit = 16,
  ) {
    if (!map) {
      throw new BadRequestException('Map is required');
    }

    const { since } = this.sinceFromDays(days);
    const safeLimit = Math.max(1, Math.min(30, Number(limit) || 16));
    const params: any[] = [user.sub, since, map.trim()];
    let whereExtra = ' AND b."map" = $3';

    if (category !== 'all') {
      params.push(category);
      whereExtra += ` AND b."category" = $${params.length}`;
    }

    if (mode && mode.trim()) {
      params.push(mode.trim());
      whereExtra += ` AND b."mode" = $${params.length}`;
    }

    const sql = `
      SELECT
        b."userBrawlerId" AS "brawlerId",
        COUNT(*)::int AS "picks",
        SUM(CASE WHEN b."result" = 'victory' THEN 1 ELSE 0 END)::int AS "wins",
        MAX(b."battleTime") AS "lastSeen"
      FROM "user_battles" b
      WHERE b."userId" = $1
        AND b."battleTime" >= $2
        AND b."userBrawlerId" IS NOT NULL
        ${whereExtra}
      GROUP BY b."userBrawlerId"
      ORDER BY "wins" DESC, "picks" DESC
      LIMIT ${safeLimit};
    `;

    const rows = await this.userBattles.query(sql, params);
    return {
      map,
      since,
      category,
      mode: mode?.trim() || null,
      items: rows.map((r: any) => {
        const picks = Number(r.picks) || 0;
        const wins = Number(r.wins) || 0;
        const brawlerId = Number(r.brawlerId);
        return {
          brawlerId,
          brawler: this.collector.brawlerName(brawlerId),
          picks,
          wins,
          winRate: picks ? wins / picks : 0,
          lastSeen: r.lastSeen,
        };
      }),
    };
  }

  async matchHistory(
    user: AppUser,
    days = 30,
    category: ProfileCategory = 'all',
    limit = 30,
  ) {
    const { since } = this.sinceFromDays(days);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30));

    const qb = this.userBattles
      .createQueryBuilder('b')
      .select([
        'b.battleId AS battleId',
        'b.battleTime AS battleTime',
        'b.category AS category',
        'b.mode AS mode',
        'b.map AS map',
        'b.result AS result',
        'b.duration AS duration',
      ])
      .where('b.userId = :userId', { userId: user.sub })
      .andWhere('b.battleTime >= :since', { since });

    this.applyCategory(qb, category);

    const rows = await qb
      .orderBy('b.battleTime', 'DESC')
      .limit(safeLimit)
      .getRawMany();

    return {
      since,
      category,
      items: rows.map((r) => ({
        battleId: r.battleId ?? r.battleid,
        battleTime: r.battleTime ?? r.battletime ?? null,
        category: r.category,
        mode: r.mode,
        map: r.map,
        result: r.result,
        duration: r.duration === null ? null : Number(r.duration),
      })),
    };
  }

  async ensureProfileExists(user: AppUser) {
    const profile = await this.getOrCreateProfile(user);
    if (!profile.playerTag) {
      throw new NotFoundException('Set your player tag first');
    }
    return profile;
  }
}
