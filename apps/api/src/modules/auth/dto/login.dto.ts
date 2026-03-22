import { IsEmail, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '6-digit TOTP code (if 2FA enabled)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}
