import { Expose, Transform } from 'class-transformer';

export class ResponseDocumentDto {
  @Transform(({ obj }) => obj._id.toString())
  @Expose()
  _id: string;

  @Expose()
  projectId: string;

  @Expose()
  parentId?: string | null;

  @Expose()
  title: string;

  @Expose()
  desc?: string;

  @Expose()
  content?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
