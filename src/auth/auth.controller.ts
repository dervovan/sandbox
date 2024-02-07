import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { Tokens } from './types';
import { User } from '@prisma/client';
import { GetUser, Public } from './decorator';
import { RtJwtGuard } from './guard';
import { GetToken } from './decorator/getToken.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() authBody: SignUpDto,
  ): Promise<{ message: string; result: Tokens }> {
    return {
      message: 'authBody',
      result: await this.authService.signup(authBody),
    };
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
