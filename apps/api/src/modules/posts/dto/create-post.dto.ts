import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Platform, MediaType } from '@barmagly/shared';

export class CreatePostDto {
  @ApiProperty() @IsString() content: string;
  @ApiProperty({ enum: Platform, isArray: true }) @IsArray() @IsEnum(Platform, { each: true }) platforms: Platform[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) socialAccountIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) mediaUrls?: string[];
  @ApiPropertyOptional({ enum: MediaType }) @IsOptional() @IsEnum(MediaType) mediaType?: MediaType;
  @ApiPropertyOptional() @IsOptional() @IsString() campaignId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() aiGenerated?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() approvalRequired?: boolean;
}
