import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Task, TaskLevel, TaskStatus, TaskType } from './task.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { plainToInstance } from 'class-transformer';
import { ForbiddenException } from '@nestjs/common';
import { ResponseTaskDetailDto } from './dto/response-task-detail.dto';
import { Comment } from '../comment/comment.entity';
import { TaskDependency } from './task-dependency.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(TaskDependency)
    private readonly taskDepRepo: Repository<TaskDependency>,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    user: { id: number },
  ): Promise<Task> {
    const task = new Task();

    task.title = createTaskDto.title;
    task.description = createTaskDto.description;
    task.assignedTo = await this.userRepository.findOneOrFail({ where: { id: createTaskDto.assignedTo } });
    task.creator = await this.userRepository.findOneOrFail({ where: { id: user.id } });
    task.project = await this.projectRepository.findOneOrFail({ where: { id: createTaskDto.project } });

    task.type = createTaskDto.type ?? TaskType.TASK;
    task.level = createTaskDto.level ?? TaskLevel.NORMAL;
    task.status = TaskStatus.READY;

    if (createTaskDto.deadline) {
      task.deadline = new Date(createTaskDto.deadline);
    }

    const savedTask = await this.taskRepository.save(task);

    // ➕ Bağımlı görevleri ekle (çoklu destek)
    if (createTaskDto.dependencyIds && createTaskDto.dependencyIds.length > 0) {
      const deps = createTaskDto.dependencyIds.map(depId => {
        const dep = new TaskDependency();
        dep.task = savedTask;
        dep.dependsOn = { id: depId } as Task;
        return dep;
      });

      await this.taskDepRepo.save(deps);

      // Bağımlıysa status WAITING yapılabilir
      savedTask.status = TaskStatus.WAITING;
      await this.taskRepository.save(savedTask);
    }

    return savedTask;
  }

  async createMany(dtos: CreateTaskDto[], user: User) {
    for (const dto of dtos) {
      await this.create(dto, user);
    }
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['dependencies', 'dependencies.dependsOn'],
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');

    task.status = status;
    await this.taskRepository.save(task);

    // 🧠 Sadece 'Completed' yapıldığında kontrol et
    if (status === TaskStatus.COMPLETED) {
      // Bu göreve bağlı olan görevleri bul (yani kimler bu task'a bağımlı?)
      const dependents = await this.taskDepRepo.find({
        where: { dependsOn: { id: task.id } },
        relations: ['task', 'task.dependencies', 'task.dependencies.dependsOn'],
      });

      for (const dep of dependents) {
        const dependentTask = dep.task;

        const allDepsCompleted = dependentTask.dependencies.every(d => d.dependsOn.status === TaskStatus.COMPLETED);

        if (allDepsCompleted && dependentTask.status === TaskStatus.WAITING) {
          dependentTask.status = TaskStatus.READY;
          await this.taskRepository.save(dependentTask);
        }
      }
    }

    return task;
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
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ResponseTaskDto, tasks, {
      excludeExtraneousValues: true,
    });
  }

  async findAllByUser(user: { id: number; role: string }): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: { assignedTo: { id: user.id } },
      relations: [
        'assignedTo',
        'creator',
        'project',
        'dependencies',
        'dependencies.dependsOn',
      ],
      order: { createdAt: 'DESC' },
    });

    return tasks.map(task => new ResponseTaskDto(task));
  }

  async findTaskDetailWithDependencies(taskId: number): Promise<ResponseTaskDetailDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'creator', 'project'],
    });
    if (!task) throw new NotFoundException('Görev bulunamadı');

    // 🔁 Bağımlı olduğu görevler
    const deps = await this.taskDepRepo.find({
      where: { task: { id: taskId } },
      relations: ['dependsOn'],
    });

    // 🧾 Görev yorumları
    const comments = await this.commentRepo.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'ASC' },
      relations: ['author', 'parent'],
    });

    const response = {
      id: task.id,
      title: task.title,
      description: task.description,
      createdAt: task.createdAt,
      status: task.status,
      type: task.type,
      level: task.level,
      deadline: task.deadline,
      creator: `${task.creator.firstName} ${task.creator.lastName}`,
      project: task.project.name,
      dependencies: deps.map(d => ({
        id: d.dependsOn.id,
        title: d.dependsOn.title,
        status: d.dependsOn.status,
      })),
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: `${comment.author.firstName} ${comment.author.lastName}`,
        parentId: comment.parent?.id ?? null,
      })),
    };

    return plainToInstance(ResponseTaskDetailDto, response, {
      excludeExtraneousValues: true,
    });
  }

  async delete(id: number, user: User): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!task) {
      throw new NotFoundException('Task bulunamadı');
    }

    // sadece creator veya admin/director silebilsin
    if (task.creator.id !== user.id && !['admin', 'director'].includes(user.role)) {
      throw new ForbiddenException('Bu taskı silme yetkiniz yok');
    }

    await this.taskRepository.remove(task);
  }

}