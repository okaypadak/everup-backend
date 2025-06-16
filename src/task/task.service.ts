import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Task, TaskLevel, TaskStatus, TaskType } from './task.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseTaskDetailDto } from './dto/response-task-detail.dto';

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

    // Zorunlu alanlar
    task.title = createTaskDto.title;
    task.description = createTaskDto.description;

    // Göreve atanan kullanıcı
    task.assignedTo = await this.userRepository.findOneOrFail({
      where: { id: createTaskDto.assignedTo },
    });

    // Görevi oluşturan kullanıcı
    task.creator = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });

    // İlgili proje
    task.project = await this.projectRepository.findOneOrFail({
      where: { id: createTaskDto.project },
    });

    // Görev tipi, seviyesi ve varsayılan statü
    task.type = createTaskDto.type ?? TaskType.TASK;
    task.level = createTaskDto.level ?? TaskLevel.NORMAL;

    // Opsiyonel: Bağımlı görev
    if (createTaskDto.dependentTaskId) {
      const depTask = await this.taskRepository.findOneOrFail({
        where: { id: createTaskDto.dependentTaskId },
      });
      task.dependentTask = depTask;
      task.status = TaskStatus.WAITING;
    } else {
      task.status = TaskStatus.READY;
    }

    // Opsiyonel: Son teslim tarihi
    if (createTaskDto.deadline) {
      task.deadline = new Date(createTaskDto.deadline);
    }

    return this.taskRepository.save(task);
  }

  async findAllByUserAndProject(projectId: number): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: {
        project: { id: projectId },
        status: In([
          TaskStatus.READY,
          TaskStatus.IN_PROGRESS,
          TaskStatus.WAITING,
        ]),
      },
      relations: ['project', 'dependentTask'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ResponseTaskDto, tasks, {
      excludeExtraneousValues: true,
    });
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

    return plainToInstance(ResponseTaskDto, task, {
      excludeExtraneousValues: true,
    });
  }

  async findTaskDetailWithDependencies(
    taskId: number,
  ): Promise<ResponseTaskDetailDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'creator', 'project', 'dependentTask'],
    });

    if (!task) {
      throw new NotFoundException('Görev bulunamadı');
    }

    let dependentTasks: { id: number; title: string; status: string }[] = [];

    if (task.dependentTask?.id) {
      dependentTasks = await this.taskRepository.find({
        where: {
          dependentTask: { id: task.dependentTask.id },
          id: Not(task.id),
        },
        select: ['id', 'title', 'status'],
        order: { createdAt: 'DESC' },
      });
    }

    const response = {
      id: task.id,
      title: task.title,
      description: task.description,
      createdAt: task.createdAt,
      status: task.status,
      type: task.type,
      level: task.level,
      deadline: task.deadline,
      creator: {
        name: `${task.creator.firstName} ${task.creator.lastName}`,
      },
      project: {
        name: task.project.name,
      },
      dependencies: dependentTasks,
    };

    return plainToInstance(ResponseTaskDetailDto, response, {
      excludeExtraneousValues: true,
    });
  }
}
