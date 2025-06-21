import { Exclude, Expose, Type } from 'class-transformer';
import { User } from '../../user/user.entity';
import { Task, TaskLevel, TaskStatus, TaskType } from '../task.entity';
import { Project } from '../../project/project.entity';
import { TaskDependency } from '../task-dependency.entity';

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
  @Type(() => TaskDependency)
  dependencies?: TaskDependency[];

  @Expose({ name: 'dependencyIds' })
  get dependencyIds(): number[] {
    if (!this.dependencies) return [];
    return this.dependencies.map(dep => dep.dependsOn?.id).filter(Boolean);
  }

  constructor(partial: Partial<Task>) {
    Object.assign(this, partial);
  }
}
