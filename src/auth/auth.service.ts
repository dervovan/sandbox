import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto, SignUpDto } from './dto';
import * as argon from 'argon2';
import { Role, User } from '@prisma/client';
import strings from './strings.js';

@Injectable({})
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async signup(
    dto: SignUpDto,
  ): Promise<{ login: string; createdAt: Date }> {
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
        login: true,
        createdAt: true,
      },
    });

    return user;
  }

  async signin(
    dto: SignInDto,
  ): Promise<{ login: string; role: Role }> {
    const existedUser =
      await this.prismaService.user.findUnique({
        where: { login: dto.login },
        select: {
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

    delete existedUser.passwordHash;

    return existedUser;
  }
}
