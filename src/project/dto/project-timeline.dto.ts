import { Expose, Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export enum ProjectTimelineEventType {
  TASK = 'task',
  COMMENT = 'comment',
  MEETING = 'meeting',
  DOCUMENT = 'document',
  SPRINT = 'sprint',
}

export class ProjectTimelineEventDto {
  @Expose()
  type: ProjectTimelineEventType;

  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  @Type(() => Date)
  timestamp: Date;

  @Expose()
  metadata?: Record<string, any>;
}

export class ProjectTimelineResponseDto {
  @Expose()
  projectId: number;

  @Expose()
  @Type(() => ProjectTimelineEventDto)
  events: ProjectTimelineEventDto[];
}

export class ProjectTimelineQueryDto {
  @IsOptional()
  @IsString()
  types?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
