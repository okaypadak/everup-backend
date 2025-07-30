// task-label.controller.ts
import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TaskLabelService } from './task-label.service';

@Controller('task-labels')
export class TaskLabelController {
  constructor(private readonly labelService: TaskLabelService) {}

  @Post(':projectId')
  async create(@Param('projectId', ParseIntPipe) projectId: number, @Body('name') name: string) {
    const label = await this.labelService.create(projectId, name);
    return { success: true, label };
  }

  @Get(':projectId')
  async getByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    const labels = await this.labelService.findByProject(projectId);
    return { success: true, labels };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.labelService.delete(id);
    return { success: true };
  }
}
