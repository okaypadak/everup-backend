import { Expose, Type } from 'class-transformer';

export class ProjectOwnerDto {
  @Expose() id: number;
  @Expose() firstName: string;
  @Expose() lastName: string;
}

export class ResponseProjectDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() description: string;
  @Expose() startDate: Date;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => ProjectOwnerDto)
  owner: ProjectOwnerDto;
}
