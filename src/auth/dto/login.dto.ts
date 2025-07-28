import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email adı boş olamaz' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre boş olamaz' })
  @MinLength(4, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;
}
