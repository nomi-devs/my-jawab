import {
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cacheTtl: number;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
    this.cacheTtl = configService.get<number>('JWT_CACHE_TTL', 300); // 5 minutes
  }

  async validate(payload: any) {
    const cacheKey = `user:${payload.sub}`;

    // Try to get user from cache first
    let user = await this.cacheManager.get<User>(cacheKey);

    if (!user) {
      // If not in cache, fetch from database (select only needed fields)
      user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'username', 'role', 'is_active'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Cache user data for faster subsequent requests
      await this.cacheManager.set(cacheKey, user, this.cacheTtl * 1000);
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Your account has been inactive.. If you want to reactivate it, please contact support.');
    }

    return { userId: user.id, username: user.username, role: user.role };
  }
}

