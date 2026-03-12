import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { extractBearerToken } from './token.helpers';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const headerKey = req.headers?.['x-admin-key'];
    const adminKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;
    const expectedAdminKey = process.env.ADMIN_KEY;

    if (
      expectedAdminKey &&
      typeof adminKey === 'string' &&
      adminKey === expectedAdminKey
    ) {
      req.user = {
        sub: 'admin-key',
        email: 'admin-key@local',
        name: 'Admin Key',
        picture: null,
        admin: true,
      };
      return true;
    }

    const token = extractBearerToken(req.headers?.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing admin token');
    }

    const user = await this.authService.verifyAppToken(token);
    if (!user.admin) {
      throw new UnauthorizedException('Admin access required');
    }

    req.user = user;
    return true;
  }
}
