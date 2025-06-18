import { Expose, Type } from 'class-transformer';
import { DependentTaskDto } from './dependent-task.dto';
import { CommentDto } from '../../comment/dto/comment.dto';

class CreatorInfoDto {
  @Expose()
  name: string;
}

class ProjectInfoDto {
  @Expose()
  name: string;
}

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
  @Type(() => CreatorInfoDto)
  creator: CreatorInfoDto;

  @Expose()
  @Type(() => ProjectInfoDto)
  project: ProjectInfoDto;

  @Expose()
  @Type(() => DependentTaskDto)
  dependencies: DependentTaskDto[];

  @Expose()
  @Type(() => CommentDto)
  comments: CommentDto[];
}
