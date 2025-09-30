import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../user/user.entity';
import { plainToInstance } from 'class-transformer';
import { ProjectResponseDto, ProjectUsersResponseDto } from './dto/project-response.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { ProjectRole, ProjectUser } from './project-user.entity';
import { Task } from '../task/task.entity';
import { Comment } from '../comment/comment.entity';
import { Meeting } from '../meeting/meeting.entity';
import { Sprint } from '../sprint/sprint.entity';
import { DocumentService } from '../document/document.service';
import {
  ProjectTimelineEventDto,
  ProjectTimelineEventType,
  ProjectTimelineQueryDto,
  ProjectTimelineResponseDto,
} from './dto/project-timeline.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectUser)
    private readonly projectUserRepo: Repository<ProjectUser>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
    private readonly documentService: DocumentService,
  ) {}

  async createProject(createDto: CreateProjectDto, userId: number): Promise<void> {
    // 1. Kullanıcıyı getir
    const creator = await this.userRepo.findOneByOrFail({ id: userId });

    // 2. Projeyi oluştur
    const project = this.projectRepo.create({
      ...createDto,
      startDate: new Date(createDto.startDate),
    });
    const savedProject = await this.projectRepo.save(project);

    // 3. Kullanıcıyı proje ile ilişkilendir (örnek: MANAGER olarak)
    const link = this.projectUserRepo.create({
      user: creator,
      project: savedProject,
      role: ProjectRole.MANAGER,
    });

    await this.projectUserRepo.save(link);
  }

  async getAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepo.find({
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ProjectResponseDto, projects, {
      excludeExtraneousValues: true,
    });
  }

  async findProjectUsers(projectId: number): Promise<ProjectUsersResponseDto> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['userLinks', 'userLinks.user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // ProjectUser[] → User[] dönüştürüyoruz
    const members = project.userLinks.map(link => ({
      id: link.user.id,
      firstName: link.user.firstName,
      lastName: link.user.lastName,
      email: link.user.email,
      role: link.role,
    }));

    return plainToInstance(ProjectUsersResponseDto, {
      id: project.id,
      name: project.name,
      members,
    }, { excludeExtraneousValues: true });
  }

  async assignUserToProject(projectId: number, dto: AssignUserDto): Promise<void> {
    const project = await this.projectRepo.findOneBy({ id: projectId });
    if (!project) throw new NotFoundException('Proje bulunamadı');

    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const existing = await this.projectUserRepo.findOne({
      where: { project: { id: projectId }, user: { id: dto.userId } },
    });
    if (existing) {
      throw new Error('Bu kullanıcı zaten projeye atanmış.');
    }

    const link = this.projectUserRepo.create({
      project,
      user,
      role: dto.role,
    });

    await this.projectUserRepo.save(link);
  }

  async removeUserFromProject(projectId: number, userId: number): Promise<void> {
    await this.projectUserRepo.delete({
      project: { id: projectId },
      user: { id: userId }
    })
  }

  async getProjectTimeline(
    projectId: number,
    filters: ProjectTimelineQueryDto,
  ): Promise<ProjectTimelineResponseDto> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const allowedTypes = new Set(Object.values(ProjectTimelineEventType));
    const requestedTypes = filters?.types
      ? filters.types
          .split(',')
          .map((type) => type.trim())
          .filter((type) => allowedTypes.has(type as ProjectTimelineEventType))
          .map((type) => type as ProjectTimelineEventType)
      : null;
    const requestedTypeSet = requestedTypes && requestedTypes.length > 0 ? new Set(requestedTypes) : null;
    const shouldInclude = (type: ProjectTimelineEventType) => !requestedTypeSet || requestedTypeSet.has(type);

    const fromDate = filters?.from ? new Date(filters.from) : null;
    const toDate = filters?.to ? new Date(filters.to) : null;

    const tasksPromise = shouldInclude(ProjectTimelineEventType.TASK)
      ? this.taskRepo.find({ where: { project: { id: projectId } } })
      : Promise.resolve([]);

    const commentsPromise = shouldInclude(ProjectTimelineEventType.COMMENT)
      ? this.commentRepo
          .createQueryBuilder('comment')
          .leftJoinAndSelect('comment.author', 'author')
          .leftJoinAndSelect('comment.task', 'task')
          .leftJoin('task.project', 'project')
          .where('project.id = :projectId', { projectId })
          .getMany()
      : Promise.resolve([]);

    const meetingsPromise = shouldInclude(ProjectTimelineEventType.MEETING)
      ? this.meetingRepo.find({
          where: { project: { id: projectId } },
          relations: ['createdBy', 'participants'],
        })
      : Promise.resolve([]);

    const sprintsPromise = shouldInclude(ProjectTimelineEventType.SPRINT)
      ? this.sprintRepo.find({
          where: { project: { id: projectId } },
          relations: ['createdBy'],
        })
      : Promise.resolve([]);

    const documentsPromise = shouldInclude(ProjectTimelineEventType.DOCUMENT)
      ? this.documentService.findByProject(projectId.toString())
      : Promise.resolve([]);

    const [tasks, comments, meetings, sprints, documents] = await Promise.all([
      tasksPromise,
      commentsPromise,
      meetingsPromise,
      sprintsPromise,
      documentsPromise,
    ]);

    const events: ProjectTimelineEventDto[] = [];

    for (const task of tasks) {
      if (!task.createdAt) {
        continue;
      }

      events.push({
        type: ProjectTimelineEventType.TASK,
        id: `task-${task.id}`,
        title: task.title,
        description: task.description,
        timestamp: new Date(task.createdAt),
        metadata: {
          status: task.status,
          level: task.level,
          deadline: task.deadline ?? null,
          sprintId: task.sprintId ?? null,
          assignee: task.assignedTo
            ? {
                id: task.assignedTo.id,
                name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim(),
              }
            : null,
        },
      });
    }

    for (const comment of comments) {
      if (!comment.createdAt || !comment.task) {
        continue;
      }

      events.push({
        type: ProjectTimelineEventType.COMMENT,
        id: `comment-${comment.id}`,
        title: comment.task.title,
        description: comment.content,
        timestamp: new Date(comment.createdAt),
        metadata: {
          taskId: comment.task.id,
          author: comment.author
            ? {
                id: comment.author.id,
                name: `${comment.author.firstName} ${comment.author.lastName}`.trim(),
              }
            : null,
        },
      });
    }

    for (const meeting of meetings) {
      const timestamp = meeting.scheduledAt ?? meeting.createdAt;
      if (!timestamp) {
        continue;
      }

      events.push({
        type: ProjectTimelineEventType.MEETING,
        id: `meeting-${meeting.id}`,
        title: meeting.title,
        description: meeting.notes ?? meeting.agenda,
        timestamp: new Date(timestamp),
        metadata: {
          location: meeting.location ?? null,
          createdBy: meeting.createdBy
            ? {
                id: meeting.createdBy.id,
                name: `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}`.trim(),
              }
            : null,
          participantCount: meeting.participants?.length ?? 0,
        },
      });
    }

    for (const sprint of sprints) {
      if (!sprint.createdAt) {
        continue;
      }

      events.push({
        type: ProjectTimelineEventType.SPRINT,
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        description: sprint.goal ?? undefined,
        timestamp: new Date(sprint.createdAt),
        metadata: {
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          createdBy: sprint.createdBy
            ? {
                id: sprint.createdBy.id,
                name: `${sprint.createdBy.firstName} ${sprint.createdBy.lastName}`.trim(),
              }
            : null,
        },
      });
    }

    for (const document of documents as any[]) {
      const createdAt = document?.createdAt ? new Date(document.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        continue;
      }

      const updatedAt = document?.updatedAt ? new Date(document.updatedAt) : null;

      events.push({
        type: ProjectTimelineEventType.DOCUMENT,
        id: `document-${document._id?.toString?.() ?? document.id ?? document._id}`,
        title: document.title,
        description: document.desc ?? undefined,
        timestamp: createdAt,
        metadata: {
          parentId: document.parentId ?? null,
          updatedAt: updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null,
        },
      });
    }

    const filteredEvents = events.filter((event) => {
      if (!event.timestamp || Number.isNaN(event.timestamp.getTime())) {
        return false;
      }
      if (fromDate && !Number.isNaN(fromDate.getTime()) && event.timestamp < fromDate) {
        return false;
      }
      if (toDate && !Number.isNaN(toDate.getTime()) && event.timestamp > toDate) {
        return false;
      }
      return true;
    });

    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return plainToInstance(
      ProjectTimelineResponseDto,
      {
        projectId: project.id,
        events: filteredEvents,
      },
      { excludeExtraneousValues: true },
    );
  }
}
