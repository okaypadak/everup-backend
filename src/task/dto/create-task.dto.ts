import { IsNotEmpty, IsOptional, IsNumber, MinLength, IsEnum, IsDateString } from 'class-validator';
import { TaskType, TaskLevel } from '../task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @MinLength(5)
  description: string;

  @IsNotEmpty()
  @IsNumber()
  assignedTo: number;

  @IsNotEmpty()
  @IsNumber()
  project: number;

  @IsOptional()
  @IsNumber()
  dependentTaskId?: number;

  @IsNotEmpty()
  @IsEnum(TaskType, { message: 'type must be one of: task, test, bug, approval.' })
  type: TaskType;

  @IsNotEmpty()
  @IsEnum(TaskLevel, { message: 'level must be one of: normal, priority, critical.' })
  level: TaskLevel;

  @IsOptional()
  @IsDateString({}, { message: 'deadline must be a valid ISO date string.' })
  deadline?: string;
}
