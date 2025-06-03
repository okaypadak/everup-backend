import { Expose, Type } from 'class-transformer';
import { TaskStatus } from '../task.entity';
import { AssignedToDto } from './assigned-to.dto';

export class ResponseTaskDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() status: TaskStatus;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => AssignedToDto)
  assignedTo: AssignedToDto;
}
