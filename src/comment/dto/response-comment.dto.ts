import { Comment } from '../comment.entity';

export class ResponseCommentDto {
  id: number;
  text: string;
  createdAt: Date;
  authorName: string;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.text = comment.content;
    this.createdAt = comment.createdAt;
    this.authorName = comment.author?.firstName;
  }
}
