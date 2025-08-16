import { Expose, Type } from 'class-transformer'
import { ResponseSprintDto } from './response-sprint.dto'
import { ResponseSprintTaskDto } from './response-sprint-task.dto'
import { ResponseSprintChartsDto } from './response-sprint-charts.dto'

export class ResponseSprintSummaryDto {
  @Expose() @Type(() => ResponseSprintDto) sprint: ResponseSprintDto | null
  @Expose() @Type(() => ResponseSprintTaskDto) tasks: ResponseSprintTaskDto[]
  @Expose() stats: { total: number; completed: number; inProgress: number; waiting: number; percent: number }
  @Expose() remainingDays: number
  @Expose() today: string                   // 'YYYY-MM-DD'
  @Expose() @Type(() => ResponseSprintChartsDto) charts: ResponseSprintChartsDto

  constructor(p: Partial<ResponseSprintSummaryDto>) {
    Object.assign(this, p)
  }
}
