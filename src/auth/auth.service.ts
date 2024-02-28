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
import {
  AuthResponse,
  TokenData,
  Tokens,
  TokenType,
} from './types';
import { MailService } from 'src/mail/mail.service';
import * as uuid from 'uuid';
import { User } from '@prisma/client';

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
    private readonly mail: MailService,
  ) {}

  private async _signupLogic(
    dto: SignUpDto,
  ): Promise<AuthResponse> {
    const hash = await argon.hash(dto.password);
    const activationKey = uuid.v4();
    this.mail.sendActivationMail(
      dto.email,
      dto.firstName,
      `${this.config.get('API_URL')}/auth/activate/${activationKey}`,
    );
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        activationKey: activationKey,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
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

    return {
      ...tokens,
      ...user,
    };
  }

  async signup(dto: SignUpDto): Promise<AuthResponse> {
    const existsEmail =
      await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

    if (existsEmail !== null) {
      throw new ForbiddenException(
        strings.emailAlreadyInUse,
      );
    }

    return this._signupLogic(dto);
  }

  async signin(dto: SignInDto): Promise<AuthResponse> {
    const existedUser =
      await this.prismaService.user.findUnique({
        where: { email: dto.email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          firstName: true,
          lastName: true,
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

    delete existedUser.passwordHash;

    return {
      ...tokens,
      ...existedUser,
    };
  }

  async logout(userId: number): Promise<void> {
    await this.updateRefreshToken(userId, '');
  }

  async activate(activationKey: string): Promise<void> {
    const user = await this.prismaService.user.findFirst({
      where: { activationKey },
    });

    if (!user) {
      throw new ForbiddenException(
        strings.invalidActivationKey,
      );
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isActivated: true,
        activationKey: null,
      },
    });
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
