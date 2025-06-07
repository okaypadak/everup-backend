import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Kullanıcı adı boş olamaz' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre boş olamaz' })
  @MinLength(4, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;
}
