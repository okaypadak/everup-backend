import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
} from '../common/constants/auth.constants';

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
    res.cookie(AUTH_COOKIE_NAME, response.token, buildAuthCookieOptions());
    return response;
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
}
