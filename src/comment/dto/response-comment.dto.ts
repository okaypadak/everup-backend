// src/comment/dto/response-comment.dto.ts
import { Comment } from '../comment.entity';

export class ResponseCommentDto {
  id: number;
  text: string;
  createdAt: Date;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.text = comment.content;
    this.createdAt = comment.createdAt;
  }
}
