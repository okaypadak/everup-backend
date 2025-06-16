import { Expose } from 'class-transformer';

export class DependentTaskDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  status: string;
}
