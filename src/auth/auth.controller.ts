import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const existing = await this.usersService.findByUsername(createUserDto.username);
    if (existing) {
      return { message: 'Kullanıcı zaten var' };
    }

    await this.usersService.create(createUserDto);
    return { message: 'Kayıt başarılı' };
  }
}
