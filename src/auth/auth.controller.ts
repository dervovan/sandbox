import { Controller, Get, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request } from "express";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Get('signup')
  signup (@Req() request : Request): string {
    
    return request.originalUrl
    // {
    //   message: this.authService.signup()
    // }
  }
  
  @Post('signin')
  signin () {
    return {
      message: this.authService.signin()
    }
  }
}