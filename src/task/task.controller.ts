import { Controller, Post, Body, Get, Param, Patch, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseTaskDto } from './dto/response-task.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() dto: CreateTaskDto): Promise<ResponseTaskDto> {
    return this.taskService.create(dto);
  }

  @Get()
  async findAll(): Promise<ResponseTaskDto[]> {
    return this.taskService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<ResponseTaskDto> {
    return this.taskService.findById(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateTaskDto): Promise<ResponseTaskDto> {
    return this.taskService.update(Number(id), dto);
  }

  @Get('assigned/me')
  async myTasks(@Req() req): Promise<ResponseTaskDto[]> {
    const userId = req.user.id;
    return this.taskService.findByAssignedUser(userId);
  }
}
