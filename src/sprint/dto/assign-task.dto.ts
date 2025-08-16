import { IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class AssignTaskDto {
  @IsInt()
  @Type(() => Number)
  taskId: number
}
