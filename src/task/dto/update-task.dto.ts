import { IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  @IsOptional() @IsNotEmpty() title?: string;
  @IsOptional() @IsNotEmpty() description?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() assignedToId?: number;
}
