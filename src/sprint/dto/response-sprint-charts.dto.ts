import { Expose } from 'class-transformer'

export class ResponseSprintChartsDto {
  @Expose() dates: string[]                 // 'YYYY-MM-DD'
  @Expose() ideal: number[]                 // ideal kalan iş (scope -> 0)
  @Expose() actualRemaining: number[]       // gerçek kalan iş
  @Expose() completedPerDay: number[]       // günlük tamamlanan
  @Expose() cumulativeCompleted: number[]   // kümülatif tamamlanan

  constructor(p: Partial<ResponseSprintChartsDto>) {
    Object.assign(this, p)
  }
}
