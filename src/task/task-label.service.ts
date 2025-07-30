// task-label.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskLabel } from './task-label.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskLabelService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly labelRepo: Repository<TaskLabel>,
  ) {}

  async create(projectId: number, name: string): Promise<TaskLabel> {
    const label = this.labelRepo.create({ project: { id: projectId }, name });
    return this.labelRepo.save(label);
  }

  async findByProject(projectId: number): Promise<TaskLabel[]> {
    return this.labelRepo.find({ where: { project: { id: projectId } } });
  }

  async delete(id: number): Promise<void> {
    await this.labelRepo.delete(id);
  }
}
