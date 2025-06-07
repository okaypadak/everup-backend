import { Expose, Type } from 'class-transformer';

// User DTO
export class UserDto {
  @Expose() id: number;
}

// Project DTO
export class ProjectDto {
  @Expose() id: number;
  @Expose() name: string;
}

// DependentTask DTO
export class DependentTaskDto {
  @Expose() id: number;

}

// Ana Response DTO
export class ResponseTaskDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() status: string;
  @Expose() type: string;
  @Expose() level: string;
  @Expose() createdAt: Date;
  @Expose() deadline: Date;

  @Expose()
  @Type(() => UserDto)
  assignedTo: UserDto;

  @Expose()
  @Type(() => UserDto)
  creator: UserDto;

  @Expose()
  @Type(() => ProjectDto)
  project: ProjectDto;

  @Expose()
  @Type(() => DependentTaskDto)
  dependentTask?: DependentTaskDto;
}
