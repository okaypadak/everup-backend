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

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectUser)
    private readonly projectUserRepo: Repository<ProjectUser>
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
}
