import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProjectResponseDto, ProjectUsersResponseDto } from './dto/project-response.dto';


@Controller('projects')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async create(
    @Body() createDto: CreateProjectDto,
    @Req() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectService.createProject(createDto, req.user.id);
  }

  @Get()
  async findAll(): Promise<ProjectResponseDto[]> {
    return this.projectService.getAllProjects();
  }

    @Get(':projectId/users')
    @Roles('admin', 'director', 'developer', 'tester', 'devOps')
    async getProjectUsers(
      @Param('projectId') projectId: number,
    ): Promise<ProjectUsersResponseDto> {
      return await this.projectService.findProjectUsers(projectId);
    }
}
