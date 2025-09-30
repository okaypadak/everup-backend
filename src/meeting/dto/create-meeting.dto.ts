import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @IsNotEmpty()
  agenda: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  meetingDate: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  meetingTime: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  participantIds?: number[];
}

export class CreateMeetingResponseDto {
  id: number;
  title: string;
  scheduledAt: Date;
}
