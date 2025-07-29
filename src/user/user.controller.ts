import { Controller, Post, Body, Get, Param, Patch, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { MessageDto } from '../common/dto/message.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<MessageDto> {
    return this.userService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findById(Number(id));
  }

  @Get()
  async findAll(): Promise<ResponseUserDto[]> {
    return this.userService.findAll();
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: number,
    @Body() dto: UpdateUserRoleDto
  ): Promise<MessageDto> {
    return this.userService.updateUserRole(id, dto.role);
  }
}
