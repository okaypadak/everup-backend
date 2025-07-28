// customer-with-task-stage.dto.ts
import { Expose } from 'class-transformer'
import { MarketingTaskStatus, TaskStatus } from '../../task/task.entity';

export class CustomerWithTaskStageDto {
  @Expose() id: number
  @Expose() firmaAdi: string
  @Expose() yetkiliKisi: string
  @Expose() email?: string
  @Expose() telefon?: string
  @Expose() notlar?: string
  @Expose() createdAt: Date
  @Expose() taskStatus?: TaskStatus
  @Expose() marketingStatus?: MarketingTaskStatus
}
