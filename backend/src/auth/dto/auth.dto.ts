import { IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(5)
  qqNumber: string;
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
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsString()
  qqNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
