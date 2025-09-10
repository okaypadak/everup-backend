import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  Patch,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResponseTaskDto } from './dto/response-task.dto';
import { TaskStatus } from './task.entity';
import { TaskCompletedInterceptor } from '../notification/interceptor/task-completed.interceptor';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async create(@Req() req: any, @Body() createTaskDto: CreateTaskDto) {
    await this.taskService.create(createTaskDto, req.user);
    return { success: true, message: 'Tekli task başarıyla oluşturuldu' };
  }

  @Post('bulk')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async createBulk(@Req() req: any, @Body() taskList: CreateTaskDto[]) {
    await this.taskService.createMany(taskList, req.user);
    return { success: true, message: 'Çoklu task başarıyla oluşturuldu' };
  }

  @Patch(':id/status')
  @Roles('admin', 'director', 'developer')
  @UseInterceptors(TaskCompletedInterceptor)
  async updateStatus(@Param('id') id: number, @Body('status') status: TaskStatus) {
    return this.taskService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('admin', 'director', 'developer')
  async deleteTask(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.taskService.delete(id, req.user);
    return { success: true, message: 'Task silindi' };
  }

  @Get('project/:projectId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async findAllByProject(@Param('projectId') projectId: number): Promise<ResponseTaskDto[]> {
    return this.taskService.findAllByUserAndProject(projectId);
  }

  @Get('user')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async findAll(@Req() req: any): Promise<ResponseTaskDto[]> {
    return this.taskService.findAllByUser(req.user);
  }

  @Get('detail/:id')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getTaskDetail(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findTaskDetailWithDependencies(id);
  }

  @Get('deleteAll')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async deleteMyTasks(@Req() req: any) {
    await this.taskService.deleteAllByUser(req.user);
    return { success: true, message: 'Tüm kendi oluşturduğun tasklar silindi' };
  }

  @Post('project/:projectId/filter')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async filterByProjectAndLabels(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body('labelIds') labelIds: number[],
  ) {
    return this.taskService.filterByProjectAndLabels(projectId, labelIds);
  }

  @Get('created')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getTasksCreatedByUser(@Req() req: any): Promise<ResponseTaskDto[]> {
    return this.taskService.findTasksCreatedByUser(req.user);
  }

  @Post('maintenance/backfill-unique-codes-all')
  @Roles('admin')
  async runBackfillAll() {
    const res = await this.taskService.backfillUniqueCodesAll();
    // Controller seviyesinde de tek satır özet log
    console.log(
      `[Backfill endpoint] total=${res.total}, updated=${res.updated}, failed=${res.failed}, duration=${res.durationMs}ms`,
    );
    return res;
  }
}
