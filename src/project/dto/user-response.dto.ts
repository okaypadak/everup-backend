// user-response.dto.ts
import { Expose } from 'class-transformer';

export class UserResponseDto {

  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

}