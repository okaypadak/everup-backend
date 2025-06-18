import { Controller, Post, Body, Get, Param, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('comments')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Bir task'ın tüm yorumları
  @Get('/task/:taskId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getByTask(@Param('taskId') taskId: number): Promise<ResponseCommentDto[]> {
    return this.commentService.findAllByTask(Number(taskId));
  }

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async createComment(@Body() dto: CreateCommentDto, @Req() req: any) {
    const savedComment = await this.commentService.createComment(dto, req.user.id);
    return {
      statusCode: 200,
      message: 'Yorum eklendi.'
    };
  }
}
