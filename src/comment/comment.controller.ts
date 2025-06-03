import { Controller, Post, Body, Get, Param, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Controller('comments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Bir task'ın tüm yorumları
  @Get('/task/:taskId')
  async getByTask(@Param('taskId') taskId: number): Promise<ResponseCommentDto[]> {
    return this.commentService.findAllByTask(Number(taskId));
  }

  // Yorum ekle
  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req): Promise<ResponseCommentDto> {
    return this.commentService.createComment(dto, req.user);
  }
}
