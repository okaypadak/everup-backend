import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Task, TaskLevel, TaskStatus, TaskType } from './task.entity';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseTaskDetailDto } from './dto/response-task-detail.dto';
import { Comment } from '../comment/comment.entity';
import { TaskDependency } from './task-dependency.entity';
import { TaskLabel } from './task-label.entity';

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
    @InjectRepository(TaskLabel)
    private readonly labelRepo: Repository<TaskLabel>,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    user: { id: number },
  ): Promise<Task> {
    const task = new Task();

    task.title = createTaskDto.title;
    task.description = createTaskDto.description;
    task.assignedTo = await this.userRepository.findOneOrFail({
      where: { id: createTaskDto.assignedTo },
    });
    task.creator = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });
    task.project = await this.projectRepository.findOneOrFail({
      where: { id: createTaskDto.project },
    });

    task.type = createTaskDto.type ?? TaskType.TASK;
    task.level = createTaskDto.level ?? TaskLevel.NORMAL;
    task.status = TaskStatus.READY;

    if (createTaskDto.deadline) {
      task.deadline = new Date(createTaskDto.deadline);
    }

    if (Array.isArray(createTaskDto.labelIds) && createTaskDto.labelIds.length > 0) {
      const labels = await this.labelRepo.findBy({ id: In(createTaskDto.labelIds) });
      task.labels = labels;
    }

    const savedTask = await this.taskRepository.save(task);

    if (Array.isArray(createTaskDto.dependencyIds) && createTaskDto.dependencyIds.length > 0) {
      const deps = createTaskDto.dependencyIds.map((depId) => {
        const dep = new TaskDependency();
        dep.task = savedTask;
        dep.dependsOn = { id: depId } as Task;
        return dep;
      });

      await this.taskDepRepo.save(deps);

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

  /**
   * Görev durumunu günceller.
   * - IN_PROGRESS: startedAt yoksa now
   * - COMPLETED: completedAt=now; startedAt yoksa createdAt (yoksa now)
   * - COMPLETED -> başka durum: completedAt=null (reopen)
   */
  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['dependencies', 'dependencies.dependsOn'],
    });

    if (!task) throw new NotFoundException('Görev bulunamadı');

    const now = new Date();

    // Başlatıldı
    if (status === TaskStatus.IN_PROGRESS) {
      if (!task.startedAt) task.startedAt = now;
      // reopen edildiyse tamamlanma tarihini temizle
      if (task.completedAt) task.completedAt = null;
    }

    // Tamamlandı
    if (status === TaskStatus.COMPLETED) {
      if (!task.startedAt) {
        // doğrudan complete edildiyse en azından makul bir başlangıç zamanı yaz
        task.startedAt = task.createdAt ?? now;
      }
      task.completedAt = now;
    }

    // Reopen (Completed dışındaki statülere dönüşte completedAt'ı temizle)
    if (
      task.status === TaskStatus.COMPLETED &&
      status !== TaskStatus.COMPLETED
    ) {
      task.completedAt = null;
    }

    task.status = status;
    await this.taskRepository.save(task);

    // Tamamlanan bir görevin bağımlılarını READY'e çekme (senin mevcut mantığın)
    if (status === TaskStatus.COMPLETED) {
      const dependents = await this.taskDepRepo.find({
        where: { dependsOn: { id: task.id } },
        relations: ['task', 'task.dependencies', 'task.dependencies.dependsOn'],
      });

      for (const dep of dependents) {
        const dependentTask = dep.task;
        const allDepsCompleted = dependentTask.dependencies.every(
          (d) => d.dependsOn.status === TaskStatus.COMPLETED,
        );

        if (allDepsCompleted && dependentTask.status === TaskStatus.WAITING) {
          dependentTask.status = TaskStatus.READY;
          await this.taskRepository.save(dependentTask);
        }
      }
    }

    return task;
  }

  /** Kısayol: Görevi başlat (IN_PROGRESS) */
  async startTask(id: number): Promise<Task> {
    return this.updateStatus(id, TaskStatus.IN_PROGRESS);
    // İstersen burada ek iş mantığı da ekleyebilirsin.
  }

  /** Kısayol: Görevi tamamla (COMPLETED) */
  async completeTask(id: number): Promise<Task> {
    return this.updateStatus(id, TaskStatus.COMPLETED);
  }

  async findAllByUserAndProject(projectId: number): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: {
        project: { id: projectId },
        status: In([
          TaskStatus.READY,
          TaskStatus.IN_PROGRESS,
          TaskStatus.WAITING,
          TaskStatus.COMPLETED,
        ]),
      },
      relations: ['project', 'labels'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => new ResponseTaskDto(task));
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
        'labels',
      ],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => new ResponseTaskDto(task));
  }

  async findTaskDetailWithDependencies(taskId: number): Promise<ResponseTaskDetailDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'creator', 'project', 'labels'],
    });

    if (!task) throw new NotFoundException('Görev bulunamadı');

    const deps = await this.taskDepRepo.find({
      where: { task: { id: taskId } },
      relations: ['dependsOn'],
    });

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
      dependencies: deps.map((d) => ({
        id: d.dependsOn.id,
        title: d.dependsOn.title,
        status: d.dependsOn.status,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: `${comment.author.firstName} ${comment.author.lastName}`,
        parentId: comment.parent?.id ?? null,
      })),
      labels: task.labels?.map((label) => label.name) ?? [],
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

    if (!task) throw new NotFoundException('Task bulunamadı');

    if (task.creator.id !== user.id && !['admin', 'director'].includes(user.role)) {
      throw new ForbiddenException('Bu taskı silme yetkiniz yok');
    }

    await this.taskRepository.remove(task);
  }

  async deleteAllByUser(user: User): Promise<void> {
    const tasks = await this.taskRepository.find({
      where: { creator: { id: user.id } },
      relations: ['creator'],
    });

    if (tasks.length > 0) {
      await this.taskRepository.remove(tasks);
    }
  }

  async filterByProjectAndLabels(projectId: number, labelIds: number[]): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.labels', 'label')
      .leftJoinAndSelect('task.project', 'project')
      .where('project.id = :projectId', { projectId })
      .andWhere('label.id IN (:...labelIds)', { labelIds })
      .getMany();

    return tasks.map((task) => new ResponseTaskDto(task));
  }

  async findTasksCreatedByUser(user: User): Promise<ResponseTaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: {
        creator: { id: user.id },
        assignedTo: { id: Not(user.id) },
      },
      relations: [
        'assignedTo',
        'creator',
        'project',
        'dependencies',
        'dependencies.dependsOn',
        'labels',
      ],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => new ResponseTaskDto(task));
  }
}
