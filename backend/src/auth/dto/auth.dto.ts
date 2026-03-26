import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  qqNumber?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  qqNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
