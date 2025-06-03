import { Controller, Post, Body, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard) // Register hariç tüm işlemlerde koruma
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Kayıt (register) - public olabilir
  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<ResponseUserDto> {
    return this.userService.create(dto);
  }

  // Tüm kullanıcıları listele (sadece admin/director görür)
  @Get()
  async findAll(): Promise<ResponseUserDto[]> {
    return this.userService.findAll();
  }

  // Kullanıcı detay
  @Get(':id')
  async findById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findById(Number(id));
  }
}
