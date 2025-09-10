import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Task } from '../task/task.entity';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly notificationService: NotificationService,
  ) {}



  async createComment(dto: CreateCommentDto, authorId: number): Promise<Comment> {
    const task = await this.taskRepo.findOne({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Görev bulunamadı');
    }

    const comment = this.commentRepo.create({
      content: dto.content,
      task,
      author: { id: authorId } as User,
    });

    if (dto.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Üst yorum bulunamadı');
      }

      comment.parent = parent;
    }

    const savedComment = await this.commentRepo.save(comment);

    try {
      if (task.assignedTo && task.assignedTo.id !== authorId) {
        await this.notificationService.createNotification({
          user: task.assignedTo,
          message: `Task "${task.title}" için yeni yorum: "${savedComment.content.slice(0, 40)}..."`,
        });
      }
    } catch (err) {
      console.error('[CommentService] Bildirim gönderilirken hata:', err);
    }

    return savedComment;
  }

  async findAllByTask(taskId: number): Promise<ResponseCommentDto[]> {
    const comments = await this.commentRepo.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'ASC' },
      relations: ['author', 'task'],
    });

    return comments.map(comment => new ResponseCommentDto(comment));
  }

  async findLatestByUser(userId: number): Promise<ResponseCommentDto[]> {
    const comments = await this.commentRepo.find({
      where: { author: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['author', 'task'],
    });

    return comments.map(comment => new ResponseCommentDto(comment));
  }
}
