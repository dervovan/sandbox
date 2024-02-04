import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsMatch } from 'src/decorators/validators';

export class SignUpDto {
  @IsNotEmpty()
  @MinLength(4, {
    message: 'login must be at least 4 characters',
  })
  @MaxLength(20, {
    message: 'login cannot exceed 20 characters',
  })
  login: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsMatch<SignUpDto>('password')
  passwordConfirm: string;
}

export class SignInDto {
  @IsNotEmpty()
  login: string;

  @IsNotEmpty()
  password: string;
}
