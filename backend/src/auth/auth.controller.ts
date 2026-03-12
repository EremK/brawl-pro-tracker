import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name?: string,
  ) {
    return this.authService.register({ email, password, name });
  }

  @Post('/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login({ email, password });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  me(@Req() req: any) {
    return { user: req.user };
  }
}
