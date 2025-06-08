import { Exclude, Expose, Type } from 'class-transformer';
import { User } from '../../user/user.entity';
import { Task, TaskLevel, TaskStatus, TaskType } from '../task.entity';
import { Project } from '../../project/project.entity';

export class ResponseTaskDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: TaskStatus;

  @Expose()
  type: TaskType;

  @Expose()
  level: TaskLevel;

  @Expose()
  createdAt: Date;

  @Expose()
  deadline?: Date;

  @Exclude()
  @Type(() => User)
  assignedTo: User;

  @Exclude()
  @Type(() => User)
  creator: User;

  @Exclude()
  @Type(() => Project)
  project: Project;

  @Exclude()
  @Type(() => Task)
  dependentTask?: Task;

  @Expose({ name: 'dependentTaskId' })
  get dependentTaskId(): number | null {
    return this.dependentTask?.id ?? null;
  }

  @Expose({ name: 'projectId' })
  get getProject(): number | null {
    return this.project?.id ?? null;
  }

  constructor(partial: Partial<Task>) {
    Object.assign(this, partial);
  }
}

