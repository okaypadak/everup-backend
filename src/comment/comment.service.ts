import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      relations: ['author'],
    });
  }

  async createComment(dto: CreateCommentDto, author: User): Promise<Comment> {
    const task = await this.taskRepo.findOne({
      where: { id: dto.taskId },
      relations: ['assignedTo'],
    });
    if (!task) throw new NotFoundException('Task bulunamadı');

    // Yetki: Sadece task'a atanmış kişi veya director, tester ekleyebilsin
    if (
      task.assignedTo.id !== author.id &&
      !['director', 'tester'].includes(author.role)
    ) {
      throw new ForbiddenException('Bu task’a yorum ekleme yetkiniz yok');
    }

    const comment = this.commentRepo.create({
      content: dto.content,
      task,
      author,
    });
    return this.commentRepo.save(comment);
  }
}