import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() authBody: AuthDto): { message: string, authBody: AuthDto } {
    return {
      message: this.authService.signup(),
      authBody: authBody
    };
  }

  @Post('signin')
  signin() {
    return {
      message: this.authService.signin(),
    };
  }
}
