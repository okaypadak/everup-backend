import { IsNotEmpty, IsEnum, IsInt } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @IsNotEmpty() title: string;
  @IsNotEmpty() description: string;
  @IsEnum(TaskStatus) status: TaskStatus;
  @IsInt() assignedToId: number;
}
