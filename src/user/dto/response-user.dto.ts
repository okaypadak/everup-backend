import { Expose } from 'class-transformer';
import { UserRole } from '../user.entity';

export class ResponseUserDto {
  @Expose() id: number;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() email: string;
  @Expose() role: UserRole;
}
