import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { TaskLevel, TaskType } from '../task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  assignedTo: number;

  @IsNumber()
  project: number;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskLevel)
  level?: TaskLevel;

  @IsOptional()
  @IsNumber()
  dependentTaskId?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
