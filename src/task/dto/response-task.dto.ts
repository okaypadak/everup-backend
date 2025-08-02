import { Expose } from 'class-transformer';

export class ResponseTaskDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  type: string;

  @Expose()
  level: string;

  @Expose()
  createdAt: Date;

  @Expose()
  deadline?: Date;

  @Expose()
  marketingStatus?: string;

  @Expose()
  labelIds: number[];

  constructor(task: any) {
    this.id = task?.id ?? null;
    this.title = task?.title ?? '';
    this.description = task?.description ?? '';
    this.status = task?.status ?? '';
    this.type = task?.type ?? '';
    this.level = task?.level ?? '';
    this.createdAt = task?.createdAt ?? new Date();
    this.deadline = task?.deadline ?? null;
    this.marketingStatus = task?.marketingStatus ?? null;
    this.labelIds = Array.isArray(task?.labels)
      ? task.labels.map((l: any) => l?.id).filter((id: any) => id != null)
      : [];
  }
}
