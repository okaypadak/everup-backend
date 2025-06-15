import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { plainToInstance } from 'class-transformer';
import { In } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    user: { id: number },
  ): Promise<Task> {
    const task = new Task();
    task.title = createTaskDto.title;
    task.description = createTaskDto.description;

    // Atanacak kullanıcıyı bul
    const assignedTo = await this.userRepository.findOneOrFail({
      where: { id: createTaskDto.assignedTo },
    });
    task.assignedTo = assignedTo;

    // Creator (oluşturan kişi)
    const creator = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });
    task.creator = creator;

    // Proje ilişkisi
    const project = await this.projectRepository.findOneOrFail({
      where: { id: createTaskDto.project },
    });
    task.project = project;

    // Bağımlı görev
    if (createTaskDto.dependentTaskId) {
      const depTask = await this.taskRepository.findOneOrFail({
        where: { id: createTaskDto.dependentTaskId },
      });
      task.dependentTask = depTask;
      task.status = TaskStatus.WAITING;
    } else {
      task.status = TaskStatus.READY;
    }

    return this.taskRepository.save(task);
  }


  async findAllByUserAndProject(
    projectId: number,
  ): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: {
        project: { id: projectId },
        status: In([TaskStatus.READY, TaskStatus.IN_PROGRESS, TaskStatus.WAITING]),
      },
      relations: ['project', 'dependentTask'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ResponseTaskDto, tasks, { excludeExtraneousValues: true });
  }

  async findAllByUser(user: {
    id: number;
    role: string;
  }): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: {
        assignedTo: { id: user.id },
      },
      relations: ['assignedTo', 'creator', 'project', 'dependentTask'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => new ResponseTaskDto(task));
  }

  async findOne(id: number): Promise<ResponseTaskDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'project', 'dependentTask', 'creator'],
    });

    if (!task) throw new NotFoundException('Görev bulunamadı.');

    return plainToInstance(ResponseTaskDto, task, { excludeExtraneousValues: true });
  }

}
