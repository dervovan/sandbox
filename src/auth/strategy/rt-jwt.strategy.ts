import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { GetToken } from '../decorator/getToken.decorator';

@Injectable()
export class RtJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('RT_JWT_SECRET'),
      passReqToCallback: true
    });
  }

  async validate(@GetToken() token : string, payload: any) {
    return {
      ...payload,
      refreshToken: token
    };
  }
}
