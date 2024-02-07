import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { GetToken } from '../decorator/getToken.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RtJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('RT_JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    payload: { sub: number }
  ) {
    const userData = await this.prisma.user.findFirst({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        login: true,
        role: true,
      },
    });
    return userData;
  }
}
