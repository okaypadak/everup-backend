// project-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class ProjectResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  startDate: Date;

  @Expose()
  createdAt: Date;

}

export class ProjectUsersResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  @Type(() => UserResponseDto)
  members: UserResponseDto[];
}