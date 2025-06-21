import { Expose, Type } from 'class-transformer';
import { DependentTaskDto } from './dependent-task.dto';
import { CommentDto } from '../../comment/dto/comment.dto';

export class ResponseTaskDetailDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  status: string;

  @Expose()
  type: string;

  @Expose()
  level: string;

  @Expose()
  deadline: Date;

  @Expose()
  creator: string;

  @Expose()
  project: string;

  @Expose()
  @Type(() => DependentTaskDto)
  dependencies: DependentTaskDto[];

  @Expose()
  @Type(() => CommentDto)
  comments: CommentDto[];
}
