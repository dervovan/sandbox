import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { GetToken } from './decorator/getToken.decorator';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() authBody: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Tokens> {
    const tokens = await this.authService.signup(authBody);
    response.cookie('accessToken', tokens.access_token, {
      expires: new Date(new Date().getTime() + 30 * 1000), // 30 days
      sameSite: 'strict',
      httpOnly: true,
    });
    return tokens;
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() authBody: SignInDto) {
    return this.authService.signin(authBody);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RtJwtGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @GetUser() user: User,
    @GetToken() rtToken: string,
  ) {
    return this.authService.refreshTokens(user.id, rtToken);
  }
}
