import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { AuthUserEntity } from '../db/entities/auth-user.entity';

export type AppJwtUser = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  admin: boolean;
};

type RegisterInput = {
  email: string;
  password: string;
  name?: string | null;
};

type LoginInput = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly cfg: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(AuthUserEntity)
    private readonly authUsers: Repository<AuthUserEntity>,
  ) {}

  private normalizeEmail(email: string) {
    return String(email ?? '').trim().toLowerCase();
  }

  private ensureJwtSecret() {
    const secret = this.cfg.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    return secret;
  }

  private getAdminEmails(): Set<string> {
    const raw = this.cfg.get<string>('ADMIN_EMAILS') ?? '';
    return new Set(
      raw
        .split(',')
        .map((v) => this.normalizeEmail(v))
        .filter(Boolean),
    );
  }

  private validatePassword(password: string) {
    if (String(password ?? '').length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, expected] = String(storedHash ?? '').split(':');
    if (!salt || !expected) return false;

    const actual = scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expected, 'hex');

    return (
      actual.length === expectedBuffer.length &&
      timingSafeEqual(actual, expectedBuffer)
    );
  }

  private toJwtUser(user: AuthUserEntity): AppJwtUser {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: null,
      admin: user.admin,
    };
  }

  async register(input: RegisterInput) {
    const email = this.normalizeEmail(input.email);
    const password = String(input.password ?? '');
    const name = String(input.name ?? '').trim() || null;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.validatePassword(password);

    const existing = await this.authUsers.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const user = this.authUsers.create({
      email,
      passwordHash: this.hashPassword(password),
      name,
      admin: this.getAdminEmails().has(email),
    });

    const saved = await this.authUsers.save(user);
    return this.createSession(saved);
  }

  async login(input: LoginInput) {
    const email = this.normalizeEmail(input.email);
    const password = String(input.password ?? '');

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.authUsers.findOne({ where: { email } });
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const allowlistAdmin = this.getAdminEmails().has(email);
    if (allowlistAdmin && !user.admin) {
      user.admin = true;
      await this.authUsers.save(user);
    }

    return this.createSession(user);
  }

  async createSession(user: AuthUserEntity) {
    const safeUser = this.toJwtUser(user);
    const token = await this.issueToken(safeUser);
    return { token, user: safeUser };
  }

  async issueToken(user: AppJwtUser): Promise<string> {
    this.ensureJwtSecret();
    const expiresIn = this.cfg.get<string>('JWT_EXPIRES_IN') ?? '7d';
    return this.jwt.signAsync(user, {
      secret: this.cfg.get<string>('JWT_SECRET'),
      expiresIn: expiresIn as any,
    });
  }

  async verifyAppToken(token: string): Promise<AppJwtUser> {
    this.ensureJwtSecret();
    try {
      const payload = await this.jwt.verifyAsync<AppJwtUser>(token, {
        secret: this.cfg.get<string>('JWT_SECRET'),
      });
      return {
        sub: payload.sub,
        email: this.normalizeEmail(payload.email),
        name: payload.name ?? null,
        picture: payload.picture ?? null,
        admin: Boolean(payload.admin),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
