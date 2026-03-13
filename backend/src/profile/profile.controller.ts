import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

@UseGuards(JwtAuthGuard)
@Controller('/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  me(@Req() req: any) {
    return this.profileService.getProfile(req.user);
  }

  @Post('/tag')
  setTag(@Req() req: any, @Body('tag') tag: string) {
    return this.profileService.setPlayerTag(req.user, tag);
  }

  @Post('/sync')
  sync(@Req() req: any) {
    return this.profileService.syncProfile(req.user);
  }

  @Post('/settings')
  saveSettings(
    @Req() req: any,
    @Body('preferredDays') preferredDays?: number | null,
    @Body('preferredBrawlerIds') preferredBrawlerIds?: number[] | null,
  ) {
    return this.profileService.saveSettings(
      req.user,
      preferredDays,
      preferredBrawlerIds,
    );
  }

  @Get('/modes')
  bestModes(
    @Req() req: any,
    @Query('days') days = '30',
    @Query('category') category: 'ranked' | 'ladder' | 'all' = 'all',
  ) {
    return this.profileService.bestModes(req.user, Number(days), category);
  }

  @Get('/brawlers')
  bestBrawlers(
    @Req() req: any,
    @Query('days') days = '30',
    @Query('category') category: 'ranked' | 'ladder' | 'all' = 'all',
    @Query('limit') limit = '24',
  ) {
    return this.profileService.bestBrawlers(
      req.user,
      Number(days),
      category,
      Number(limit),
    );
  }

  @Get('/maps')
  maps(
    @Req() req: any,
    @Query('days') days = '60',
    @Query('category') category: 'ranked' | 'ladder' | 'all' = 'all',
  ) {
    return this.profileService.personalMaps(req.user, Number(days), category);
  }

  @Get('/brawlers-by-map')
  brawlersByMap(
    @Req() req: any,
    @Query('map') map: string,
    @Query('days') days = '60',
    @Query('category') category: 'ranked' | 'ladder' | 'all' = 'ranked',
    @Query('mode') mode?: string,
    @Query('limit') limit = '16',
  ) {
    return this.profileService.bestBrawlersByMap(
      req.user,
      map,
      Number(days),
      category,
      mode,
      Number(limit),
    );
  }

  @Get('/matches')
  history(
    @Req() req: any,
    @Query('days') days = '30',
    @Query('category') category: 'ranked' | 'ladder' | 'all' = 'all',
    @Query('limit') limit = '30',
  ) {
    return this.profileService.matchHistory(
      req.user,
      Number(days),
      category,
      Number(limit),
    );
  }
}
