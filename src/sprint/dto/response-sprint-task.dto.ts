import { Expose, Transform } from 'class-transformer'
import { Task } from '../../task/task.entity'

export class ResponseSprintTaskDto {
  @Expose() id: number
  @Expose() title: string

  // ham status (ör: 'completed' | 'in_progress' | 'pending' ...)
  @Expose() status?: string

  // Vue tarafında Türkçe label kullanmak istersen:
  @Expose()
  @Transform(({ obj }: { obj: Task }) => {
    const s = (obj.status || '').toLowerCase()
    if (['completed', 'done', 'tamamlandı'].includes(s)) return 'Tamamlandı'
    if (['in_progress', 'doing', 'devam'].includes(s)) return 'Devam'
    return 'Bekliyor'
  })
  statusLabel: string

  @Expose()
  @Transform(({ obj }: { obj: Task }) => obj.sprint?.id ?? null)
  sprintId: number | null

  @Expose()
  @Transform(({ obj }: { obj: Task }) => obj.project?.id ?? (obj as any).projectId ?? null)
  projectId: number | null

  constructor(t: Task) {
    Object.assign(this, t)
  }
}
