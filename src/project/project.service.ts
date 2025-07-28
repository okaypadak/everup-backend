import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../user/user.entity';
import { plainToInstance } from 'class-transformer';
import { ProjectResponseDto, ProjectUsersResponseDto } from './dto/project-response.dto';



@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async createProject(createDto: CreateProjectDto, userId: number): Promise<void> {
    // 1. Kullanıcıyı bul
    const creator = await this.userRepo.findOneByOrFail({ id: userId });

    // 2. Yeni proje oluştur ve kullanıcıyı ilişkilendir
    const project = this.projectRepo.create({
      ...createDto,
      startDate: new Date(createDto.startDate),
      users: [creator],
    });

    // 3. Projeyi kaydet
    await this.projectRepo.save(project);
  }

  async getAllProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepo.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ProjectResponseDto, projects, {
      excludeExtraneousValues: true,
    });
  }

  async findProjectUsers(projectId: number): Promise<ProjectUsersResponseDto> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['users'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return plainToInstance(ProjectUsersResponseDto, {
      id: project.id,
      name: project.name,
      members: project.users,
    }, { excludeExtraneousValues: true });
  }


}
