import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  useremail: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
