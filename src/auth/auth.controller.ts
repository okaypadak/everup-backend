import { Body, Controller, Post, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, buildAuthCookieOptions } from './auth.constants';
import { extractTokenFromRequest } from './utils/auth-token.util';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.validateUser(loginDto);

    // 🍪 Cookie set et
    res.cookie(AUTH_COOKIE_NAME, response.token, buildAuthCookieOptions());

    // user bilgisi de dönüyoruz (frontend UI için)
    const decoded: any = jwt.decode(response.token);
    return {
      message: response.message,
      expiresAt: response.expiresAt,
      user: {
        id: decoded.id,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
      },
    };
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const existing = await this.usersService.findByEmail(createUserDto.email);
    if (existing) {
      return { message: 'Kullanıcı zaten var' };
    }

    await this.usersService.create(createUserDto);
    return { message: 'Kayıt başarılı' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = extractTokenFromRequest(req as any);
    if (!token) return { user: null };

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      return {
        user: {
          id: decoded.id,
          name: `${decoded.firstName} ${decoded.lastName}`,
          role: decoded.role,
        },
      };
    } catch {
      return { user: null };
    }
  }

  // ✅ Logout (cookie'yi sıfırlar)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie(AUTH_COOKIE_NAME, '', {
      ...buildAuthCookieOptions(),
      maxAge: 0,
    });
    return { message: 'Çıkış başarılı' };
  }
}
