import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() authBody: SignUpDto,
  ): Promise<{ message: string; result: {login:string, createdAt: Date} }> {

    return {
      message: 'authBody',
      result: await this.authService.signup(authBody),
    };

  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() authBody: SignInDto) {
        
    return this.authService.signin(authBody);
  }
}
