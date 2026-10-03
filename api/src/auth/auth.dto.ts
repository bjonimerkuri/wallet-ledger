import { IsEmail, MinLength } from 'class-validator';

export class CredentialsDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
