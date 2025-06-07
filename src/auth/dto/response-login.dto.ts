// src/auth/dto/response-login.dto.ts
import { Expose } from 'class-transformer';

export class ResponseLoginDto {
  @Expose()
  message: string;

  @Expose()
  token: string;
}
