// src/comment/dto/comment.dto.ts

import { Expose, Type } from 'class-transformer';

export class CommentAuthorDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

export class CommentDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  parentId?: number | null;

  @Expose()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;
}
