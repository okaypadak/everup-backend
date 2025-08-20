import { Expose } from 'class-transformer';

export class ResponseTaskDto {
  @Expose()
  id: number;

  @Expose()
  uniqueCode: string;

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
  labelIds: string[];

  constructor(task: any) {
    this.id = task.id;
    this.title = task.title;
    this.description = task.description;
    this.status = task.status;
    this.type = task.type;
    this.level = task.level;
    this.createdAt = task.createdAt;
    this.deadline = task.deadline;
    this.marketingStatus = task.marketingStatus;
    this.labelIds = task.labels?.map((l: any) => l.id) ?? [];
  }
}
