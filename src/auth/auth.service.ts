import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto, SignUpDto } from './dto';
import * as argon from 'argon2';
import strings from './strings.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './types';

@Injectable({})
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignUpDto): Promise<Tokens> {
    const hash = await argon.hash(dto.password);

    const existsLogin =
      await this.prismaService.user.findUnique({
        where: { login: dto.login },
      });

    if (existsLogin !== null) {
      throw new ForbiddenException(
        strings.loginAlreadyExists,
      );
    }

    const existsEmail =
      await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

    if (existsEmail !== null) {
      throw new ForbiddenException(
        strings.emailAlreadyInUse,
      );
    }

    const user = await this.prismaService.user.create({
      data: {
        login: dto.login,
        email: dto.email,
        passwordHash: hash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return {
      access_token: await this.signToken(
        user.id,
        user.email,
      ),
    };
  }

  async signin(dto: SignInDto): Promise<Tokens> {
    const existedUser =
      await this.prismaService.user.findUnique({
        where: { login: dto.login },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          login: true,
          role: true,
        },
      });

    if (!existedUser) {
      throw new ForbiddenException(strings.notValidLogin);
    }

    const isMatch = await argon.verify(
      existedUser?.passwordHash,
      dto.password,
    );

    if (!isMatch) {
      throw new ForbiddenException(strings.notValidLogin);
    }

    return {
      access_token: await this.signToken(
        existedUser.id,
        existedUser.email,
      ),
    };
  }

  async logout() {}

  signToken(
    userId: number,
    email: string,
  ): Promise<string> {
    const data = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    return this.jwt.signAsync(data, {
      expiresIn: this.config.get(
        'ACCESS_TOKEN_EXPIRE_TIME',
      ),
      secret: secret,
    });
  }
}
