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

  @Get('/task/:taskId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getByTask(@Param('taskId') taskId: number): Promise<ResponseCommentDto[]> {
    return this.commentService.findAllByTask(Number(taskId));
  }

  @Get('/me')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getMyComments(@Req() req: any): Promise<ResponseCommentDto[]> {
    return this.commentService.findLatestByUser(req.user.id);
  }

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async createComment(@Body() dto: CreateCommentDto, @Req() req: any) {
    try {
      await this.commentService.createComment(dto, req.user.id);
      return {
        statusCode: 200,
        message: 'Yorum başarıyla eklendi.',
      };
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message || 'Yorum eklenirken bir hata oluştu.',
      };
    }
  }
}
