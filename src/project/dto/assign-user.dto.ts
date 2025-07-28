import { IsEnum, IsNumber } from 'class-validator';
import { ProjectRole } from '../project-user.entity';

export class AssignUserDto {
  @IsNumber()
  userId: number;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
