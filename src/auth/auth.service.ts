import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto, SignUpDto } from './dto';
import * as argon from 'argon2';
import strings from './strings.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenData, Tokens, TokenType } from './types';

@Injectable({})
export class AuthService {
  private readonly tokenData: Record<TokenType, TokenData> =
    {
      [TokenType.AccessToken]: {
        secret: this.config.get('AT_JWT_SECRET'),
        expires: this.config.get(
          'ACCESS_TOKEN_EXPIRE_TIME',
        ),
      },
      [TokenType.RefreshToken]: {
        secret: this.config.get('RT_JWT_SECRET'),
        expires: this.config.get(
          'REFRESH_TOKEN_EXPIRE_TIME',
        ),
      },
    };

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

    const tokens = await this.getTokens(
      user.id,
      user.email,
    );

    await this.updateRefreshToken(
      user.id,
      tokens.refresh_token,
    );
    return tokens;
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

    const tokens = await this.getTokens(
      existedUser.id,
      existedUser.email,
    );

    await this.updateRefreshToken(
      existedUser.id,
      tokens.refresh_token,
    );
    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.updateRefreshToken(userId, '');
  }

  async refreshTokens(
    userId: number,
    rtToken: string,
  ): Promise<Tokens> {
    const existedUser =
      await this.prismaService.user.findFirst({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          login: true,
          role: true,
          refreshTokenHash: true,
        },
      });

    if (
      !existedUser ||
      rtToken === '' ||
      existedUser.refreshTokenHash === ''
    ) {
      throw new ForbiddenException(strings.accessDenied);
    }

    const tokenMatches = await argon.verify(
      existedUser.refreshTokenHash,
      rtToken,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException();
    }

    const tokens = await this.getTokens(
      existedUser.id,
      existedUser.email,
    );

    await this.updateRefreshToken(
      existedUser.id,
      tokens.refresh_token,
    );

    return tokens;
  }

  signToken(
    userId: number,
    email: string,
    tokenType: TokenType,
  ): Promise<string> {
    const data = {
      sub: userId,
      email,
    };

    return this.jwt.signAsync(data, {
      expiresIn: this.tokenData[tokenType].expires,
      secret: this.tokenData[tokenType].secret,
    });
  }

  async updateRefreshToken(userId: number, rt: string) {
    const hash = rt ? await argon.hash(rt) : rt;
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: hash,
      },
    });
  }

  async getTokens(
    userId: number,
    email: string,
  ): Promise<Tokens> {
    return {
      access_token: await this.signToken(
        userId,
        email,
        TokenType.AccessToken,
      ),
      refresh_token: await this.signToken(
        userId,
        email,
        TokenType.RefreshToken,
      ),
    };
  }
}
