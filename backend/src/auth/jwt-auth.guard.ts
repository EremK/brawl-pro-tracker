import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { extractBearerToken } from './token.helpers';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = extractBearerToken(req.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    req.user = await this.authService.verifyAppToken(token);
    return true;
  }
}
