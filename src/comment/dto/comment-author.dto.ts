import { Expose } from 'class-transformer';

export class CommentAuthorDto {
  @Expose() id: number;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() role: string;
}
