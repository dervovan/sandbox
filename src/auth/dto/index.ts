import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsMatch } from 'src/decorators/validators';

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignInDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
