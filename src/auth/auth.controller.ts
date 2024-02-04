import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { Role, User } from '@prisma/client';

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

  @Post('signin')
  signin(@Body() authBody: SignInDto): Promise<{ login: string; role: Role }> {
        
    return this.authService.signin(authBody);
  }
}
