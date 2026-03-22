import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@barmagly/shared';

export class InviteMemberDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
}
