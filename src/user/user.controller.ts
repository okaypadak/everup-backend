import { Controller, Post, Body, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<{ message: string }> {
    await this.userService.create(dto);
    return { message: 'başarılı' };
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findById(Number(id));
  }
}
