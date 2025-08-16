import { Expose, Transform } from 'class-transformer'
import { Task } from '../../task/task.entity'

export class ResponseTaskLiteDto {
  @Expose() id: number
  @Expose() title: string

  @Expose()
  @Transform(({ obj }: { obj: Task }) => obj.sprint?.id ?? null)
  sprintId: number | null

  @Expose()
  @Transform(({ obj }: { obj: Task }) => obj.project?.id ?? null)
  projectId: number | null

  constructor(t: Task) {
    Object.assign(this, t)
  }
}
