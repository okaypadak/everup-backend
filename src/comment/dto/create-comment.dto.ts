import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty() content: string;
  @IsNumber() taskId: number;
}
