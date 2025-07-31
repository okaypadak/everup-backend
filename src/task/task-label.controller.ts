// task-label.controller.ts
import { Controller, Post, Get, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TaskLabelService } from './task-label.service';

@Controller('task-labels')
export class TaskLabelController {
  constructor(private readonly labelService: TaskLabelService) {}

  @Post(':projectId')
  async create(@Param('projectId', ParseIntPipe) projectId: number, @Body('name') name: string) {
    return await this.labelService.create(projectId, name);
  }

  @Get(':projectId')
  async getByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return await this.labelService.findByProject(projectId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.labelService.delete(id);
    return { success: true };
  }


}
