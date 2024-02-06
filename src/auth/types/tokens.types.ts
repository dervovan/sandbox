export type Tokens = {
  access_token?: string;
  refresh_token?: string;
};

export enum TokenType {
  AccessToken = 'AccessToken',
  RefreshToken = 'RefreshToken'
}

export type TokenData = {
  expires: string,
  secret: string
}