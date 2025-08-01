export class ResponseCommentDto {
  id: number;
  text: string;
  createdAt: Date;
  authorName: string;
  taskTitle: string;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.text = comment.content;
    this.createdAt = comment.createdAt;
    this.authorName = comment.author?.name;
    this.taskTitle = comment.task?.title;
  }
}
