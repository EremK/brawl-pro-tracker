import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectorModule } from '../collector/collector.module';
import { UserProfileEntity } from '../db/entities/user-profile.entity';
import { UserBattleEntity } from '../db/entities/user-battle.entity';
import { UserBattlePickEntity } from '../db/entities/user-battle-pick.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    AuthModule,
    CollectorModule,
    TypeOrmModule.forFeature([
      UserProfileEntity,
      UserBattleEntity,
      UserBattlePickEntity,
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
