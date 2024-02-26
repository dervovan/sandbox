import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { Tokens } from './types';
import { User } from '@prisma/client';
import { GetUser, Public } from './decorator';
import { RtJwtGuard } from './guard';
import { GetRefreshToken } from './decorator/getToken.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() authBody: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Tokens> {
    const authData =
      await this.authService.signup(authBody);
    response.cookie(
      'refreshToken',
      authData.refresh_token,
      {
        expires: new Date(
          new Date().getTime() +
            parseInt(
              this.config.get(
                'REFRESH_TOKEN_EXPIRE_TIME_MILLISECOND',
              ),
            ),
        ),
        sameSite: 'strict',
        httpOnly: true,
      },
    );
    return authData;
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() authBody: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authData =
      await this.authService.signin(authBody);
    response.cookie(
      'refreshToken',
      authData.refresh_token,
      {
        expires: new Date(
          new Date().getTime() +
            parseInt(
              this.config.get(
                'REFRESH_TOKEN_EXPIRE_TIME_MILLISECOND',
              ),
            ),
        ),
        sameSite: 'strict',
        httpOnly: true,
      },
    );
    return authData;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Get('activate/:activationKey')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('activationKey') activationKey: string,
  ) {
    await this.authService.activate(activationKey);
    return {
      message: 'activated',
    };
  }

  @Public()
  @Post('refresh')
  @UseGuards(RtJwtGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @GetUser() user: User,
    @GetRefreshToken() rtToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user.id,
      rtToken,
    );
    response.cookie('refreshToken', tokens.refresh_token, {
      expires: new Date(
        new Date().getTime() +
          parseInt(
            this.config.get(
              'REFRESH_TOKEN_EXPIRE_TIME_MILLISECOND',
            ),
          ),
      ),
      sameSite: 'strict',
      httpOnly: true,
    });

    return tokens.access_token;
  }
}
