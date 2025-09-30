import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { SprintService } from './sprint.service'
import { RolesGuard } from '../auth/roles.guard'
import { ResponseSprintDto } from './dto/response-sprint.dto'
import { Roles } from '../auth/roles.decorator'

@Controller('projects/:projectId/sprints')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProjectSprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Get()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async listByProject(
    @Req() req: any,
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ResponseSprintDto[]> {
    const sprints = await this.sprintService.listByProject(req.user, projectId)

    return sprints.map((sprint) => new ResponseSprintDto(sprint))
  }
}
