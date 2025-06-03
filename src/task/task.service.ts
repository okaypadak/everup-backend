import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../user/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const user = await this.userRepo.findOne({ where: { id: dto.assignedToId } });
    if (!user) throw new NotFoundException('Atanan kullanıcı bulunamadı');
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      assignedTo: user,
    });
    return this.taskRepo.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task bulunamadı');
    return task;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.assignedToId !== undefined) {
      const user = await this.userRepo.findOne({ where: { id: dto.assignedToId } });
      if (!user) throw new NotFoundException('Atanan kullanıcı bulunamadı');
      task.assignedTo = user;
    }

    return this.taskRepo.save(task);
  }

  async findByAssignedUser(userId: number): Promise<Task[]> {
    return this.taskRepo.find({
      where: { assignedTo: { id: userId } },
      order: { createdAt: 'DESC' }
    });
  }
}
