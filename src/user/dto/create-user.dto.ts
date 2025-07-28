import { IsEmail, IsEnum, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {

  @IsNotEmpty({ message: 'Ad boş olamaz' })
  firstName: string;

  @IsNotEmpty({ message: 'Soyad boş olamaz' })
  lastName: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  password: string;

  @IsEnum(UserRole, { message: 'Geçersiz rol seçimi' })
  role: UserRole;
}
