import { Role } from "@prisma/client";

export type Tokens = {
  access_token?: string;
  refresh_token?: string;
};

export enum TokenType {
  AccessToken = 'AccessToken',
  RefreshToken = 'RefreshToken',
}

export type TokenData = {
  expires: string;
  secret: string;
};

export type AuthResponse = Tokens & {
  id: number;
  email: string;
  role: Role[];
  firstName: string;
  lastName: string;
};
