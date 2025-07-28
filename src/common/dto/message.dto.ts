import { Expose } from 'class-transformer';

export class MessageDto {
  @Expose()
  message: string;

  @Expose()
  code: string;

  constructor(message: string, code = '00') {
    this.message = message;
    this.code = code;
  }
}
