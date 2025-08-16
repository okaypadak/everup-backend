import { Expose, Transform } from 'class-transformer'
import { Sprint } from '../sprint.entity'

export class ResponseSprintDto {
  @Expose() id: number
  @Expose() name: string
  @Expose() startDate: string
  @Expose() endDate: string
  @Expose() goal?: string

  @Expose()
  @Transform(({ obj }: { obj: Sprint }) => obj.project?.id)
  projectId: number

  @Expose()
  @Transform(({ obj }: { obj: Sprint }) => obj.project?.name)
  projectName: string

  @Expose() createdAt: Date

  constructor(s: Sprint) {
    Object.assign(this, s)
  }
}
