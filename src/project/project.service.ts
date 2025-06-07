import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../user/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async create(dto: CreateProjectDto, owner: User): Promise<Project> {

    const dateStr = dto.startDate;
    if (!/^\d{8}$/.test(dateStr)) throw new BadRequestException('startDate yyyyMMdd formatında olmalı');
    const year = Number(dateStr.substring(0, 4));
    const month = Number(dateStr.substring(4, 6)) - 1; // JS Date ayı 0-indexli
    const day = Number(dateStr.substring(6, 8));
    const parsedDate = new Date(Date.UTC(year, month, day));

    if (isNaN(parsedDate.getTime())) throw new BadRequestException('Geçersiz tarih');

    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      startDate: parsedDate,
      owner,
    });
    return this.projectRepo.save(project);
  }

  // Diğer metotlar değişmeden devam...
}
