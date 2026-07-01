import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../../prisma/prisma.service';

type CachedUser = {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cacheTtl: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
    this.cacheTtl = configService.get<number>('JWT_CACHE_TTL', 300);
  }

  async validate(payload: any) {
    const cacheKey = `user:${payload.sub}`;

    let user = await this.cacheManager.get<CachedUser>(cacheKey);

    if (!user) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, role: true, is_active: true },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      user = dbUser as CachedUser;
      await this.cacheManager.set(cacheKey, user, this.cacheTtl * 1000);
    }

    if (!user.is_active) {
      throw new UnauthorizedException(
        'Your account has been inactive.. If you want to reactivate it, please contact support.',
      );
    }

    return { userId: user.id, username: user.username, role: user.role };
  }
}
