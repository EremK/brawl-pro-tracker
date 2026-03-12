import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAccessGuard } from './admin-access.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUserEntity } from '../db/entities/auth-user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AuthUserEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') ?? 'missing-jwt-secret',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminAccessGuard, JwtAuthGuard],
  exports: [AuthService, AdminAccessGuard, JwtAuthGuard],
})
export class AuthModule {}
