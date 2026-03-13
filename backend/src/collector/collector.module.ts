import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectorService } from './collector.service';
import { TrackedPlayerEntity } from '../db/entities/tracked-player.entity';
import { BattleEntity } from '../db/entities/battle.entity';
import { BattleTeamPickEntity } from '../db/entities/battle-team-pick.entity';
import { BrawlerEntity } from '../db/entities/brawler.entity';
import { ConfigModule } from '@nestjs/config';
import { UserProfileEntity } from '../db/entities/user-profile.entity';
import { UserBattleEntity } from '../db/entities/user-battle.entity';
import { UserBattlePickEntity } from '../db/entities/user-battle-pick.entity';
import { RankedHelperBaseDailyEntity } from '../db/entities/ranked-helper-base-daily.entity';
import { RankedHelperCounterDailyEntity } from '../db/entities/ranked-helper-counter-daily.entity';
import { RankedHelperSynergyDailyEntity } from '../db/entities/ranked-helper-synergy-daily.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([TrackedPlayerEntity, BattleEntity, BattleTeamPickEntity, BrawlerEntity, UserProfileEntity, UserBattleEntity, UserBattlePickEntity, RankedHelperBaseDailyEntity, RankedHelperCounterDailyEntity, RankedHelperSynergyDailyEntity]),
    ],
    providers: [CollectorService],
    exports: [CollectorService],
})
export class CollectorModule { }
