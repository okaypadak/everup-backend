import { Expose, Type } from 'class-transformer';

export class CommentAuthorDto {
  @Expose() id: number;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() role: string;
}

export class ResponseCommentDto {
  @Expose() id: number;
  @Expose() content: string;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;
}
