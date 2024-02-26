import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
        // ExtractJwt.fromAuthHeaderAsBearerToken(),
        function (req) {
          return req?.cookies?.['refreshToken'];
        },
      secretOrKey: config.get('RT_JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(payload: { sub: number }) {
    const userData = await this.prisma.user.findFirst({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });
    return userData;
  }
}
