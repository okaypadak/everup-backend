import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Task } from '../task/task.entity';
import { User } from '../user/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async findAllByTask(taskId: number): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'ASC' },
      relations: ['author', 'parent'],
    });
  }

  async createComment(dto: CreateCommentDto, author: User): Promise<Comment> {
    const task = await this.taskRepo.findOne({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Görev bulunamadı');
    }

    const comment = this.commentRepo.create({
      content: dto.content,
      task,
      author,
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

    return this.commentRepo.save(comment);
  }
}
