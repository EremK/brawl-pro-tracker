import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectorService } from './collector.service';
import { TrackedPlayerEntity } from '../db/entities/tracked-player.entity';
import { BattleEntity } from '../db/entities/battle.entity';
import { BattleTeamPickEntity } from '../db/entities/battle-team-pick.entity';
import { BrawlerEntity } from '../db/entities/brawler.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([TrackedPlayerEntity, BattleEntity, BattleTeamPickEntity, BrawlerEntity]),
    ],
    providers: [CollectorService],
    exports: [CollectorService],
})
export class CollectorModule { }