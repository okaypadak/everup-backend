import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { ResponseLoginDto } from './dto/response-login.dto';
import { LoginDto } from './dto/login.dto';
import { getAuthTokenTtlSeconds } from '../common/constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(loginDto: LoginDto): Promise<ResponseLoginDto> {
    // Kullanıcıyı e-mail ile bul
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Şifre yanlış');
    }

    // JWT token oluştur
    const expiresInSeconds = getAuthTokenTtlSeconds();
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET as string,
      { expiresIn: expiresInSeconds }
    );

    // DTO olarak dön
    return {
      message: 'Giriş başarılı',
      token,
      expiresIn: expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }
}
