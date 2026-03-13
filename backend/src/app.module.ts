import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BrawlerEntity } from './db/entities/brawler.entity';
import { AppController } from './app.controller';
import { TrackedPlayerEntity } from './db/entities/tracked-player.entity';
import { BattleEntity } from './db/entities/battle.entity';
import { BattleTeamPickEntity } from './db/entities/battle-team-pick.entity';
import { CollectorModule } from './collector/collector.module';
import { HttpModule } from '@nestjs/axios'; 
import { AuthModule } from './auth/auth.module';
import { AuthUserEntity } from './db/entities/auth-user.entity';
import { UserProfileEntity } from './db/entities/user-profile.entity';
import { UserBattleEntity } from './db/entities/user-battle.entity';
import { UserBattlePickEntity } from './db/entities/user-battle-pick.entity';
import { ProfileModule } from './profile/profile.module';
import { RankedHelperBaseDailyEntity } from './db/entities/ranked-helper-base-daily.entity';
import { RankedHelperCounterDailyEntity } from './db/entities/ranked-helper-counter-daily.entity';
import { RankedHelperSynergyDailyEntity } from './db/entities/ranked-helper-synergy-daily.entity';


@Module({
  imports: [
    HttpModule,
    AuthModule,
    ProfileModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // cron support :contentReference[oaicite:3]{index=3}

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: Number(cfg.get('DB_PORT')),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        entities: [TrackedPlayerEntity, BattleEntity, BattleTeamPickEntity, BrawlerEntity, AuthUserEntity, UserProfileEntity, UserBattleEntity, UserBattlePickEntity, RankedHelperBaseDailyEntity, RankedHelperCounterDailyEntity, RankedHelperSynergyDailyEntity],
        synchronize: true, // OK for personal project; later use migrations
        logging: false,
      }),
    }),

    TypeOrmModule.forFeature([TrackedPlayerEntity, BattleEntity, BattleTeamPickEntity, BrawlerEntity, AuthUserEntity, UserProfileEntity, UserBattleEntity, UserBattlePickEntity, RankedHelperBaseDailyEntity, RankedHelperCounterDailyEntity, RankedHelperSynergyDailyEntity]),
    CollectorModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
