import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common'
import { SprintService } from './sprint.service'
import { CreateSprintDto } from './dto/create-sprint.dto'
import { ResponseSprintDto } from './dto/response-sprint.dto'
import { ResponseSprintTaskDto } from './dto/response-sprint-task.dto'
import { ResponseSprintSummaryDto } from './dto/response-sprint-summary.dto'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { plainToInstance } from 'class-transformer'

@Controller('sprints')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  // Sprint oluştur
  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async create(
    @Req() req: any,
    @Body() dto: CreateSprintDto,
  ): Promise<ResponseSprintDto> {
    const sprint = await this.sprintService.create(req.user, dto)
    return new ResponseSprintDto(sprint)
  }

  // Projeye ait tüm sprintler
  @Get('project/:projectId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async listByProject(
    @Req() req: any,
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ResponseSprintDto[]> {
    const list = await this.sprintService.listByProject(req.user, projectId)
    return list.map((s) => new ResponseSprintDto(s))
  }

  // Proje için aktif sprint (bugüne göre)
  @Get('active/:projectId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getActiveForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ResponseSprintDto | null> {
    const s = await this.sprintService.getActiveForProject(projectId)
    return s ? new ResponseSprintDto(s) : null
  }

  // Proje için aktif sprint özeti (grafikler + istatistikler)
  @Get('active/:projectId/summary')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getActiveSummaryForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ResponseSprintSummaryDto> {
    const res = await this.sprintService.getActiveSummaryForProject(projectId)

    if (!res.sprint) {
      return new ResponseSprintSummaryDto({
        sprint: null,
        tasks: [],
        stats: res.stats,
        remainingDays: res.remainingDays,
        today: res.today,
        charts: res.charts,
      })
    }

    return new ResponseSprintSummaryDto({
      sprint: new ResponseSprintDto(res.sprint),
      tasks: plainToInstance(ResponseSprintTaskDto, res.tasks, {
        excludeExtraneousValues: true,   // 👈 sadece @Expose alanları kalsın
      }),
      stats: res.stats,
      remainingDays: res.remainingDays,
      today: res.today,
      charts: res.charts,
    })
  }

  // Bir sprint'teki görevler
  @Get(':sprintId/tasks')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async tasksOfSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
  ): Promise<ResponseSprintTaskDto[]> {
    const tasks = await this.sprintService.tasksOfSprint(sprintId)
    return tasks.map((t) => new ResponseSprintTaskDto(t))
  }

  // Projede sprint'e atanabilir (sprintsiz) görevler
  @Get('project/:projectId/available-tasks')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async availableTasksForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ResponseSprintTaskDto[]> {
    const tasks = await this.sprintService.availableTasksForProject(projectId)
    return tasks.map((t) => new ResponseSprintTaskDto(t))
  }

  // Görevi sprint'e ata
  @Post(':sprintId/tasks/:taskId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async assignTask(
    @Req() req: any,
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ResponseSprintTaskDto> {
    const task = await this.sprintService.assignTaskToSprint(req.user, sprintId, taskId)
    return new ResponseSprintTaskDto(task)
  }

  // Görevi sprint'ten çıkar
  @Delete(':sprintId/tasks/:taskId')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async removeTask(
    @Req() req: any,
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ResponseSprintTaskDto> {
    const task = await this.sprintService.removeTaskFromSprint(req.user, sprintId, taskId)
    return new ResponseSprintTaskDto(task)
  }

  // Tek sprint detay
  @Get(':id')
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseSprintDto> {
    const sprint = await this.sprintService.getOne(id)
    return new ResponseSprintDto(sprint)
  }
}
