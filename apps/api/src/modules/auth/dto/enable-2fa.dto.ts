import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
  @ApiProperty({ description: '6-digit TOTP code' })
  @IsString()
  @Length(6, 6)
  totpCode: string;
}
