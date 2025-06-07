import { IsEmail, IsEnum, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Kullanıcı adı boş olamaz' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  username: string;

  @IsNotEmpty({ message: 'Ad boş olamaz' })
  firstName: string;

  @IsNotEmpty({ message: 'Soyad boş olamaz' })
  lastName: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @IsNotEmpty({ message: 'Şifre boş olamaz' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsEnum(UserRole, { message: 'Geçersiz rol seçimi' })
  role: UserRole;
}
