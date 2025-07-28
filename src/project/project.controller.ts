import {
  Body,
  ClassSerializerInterceptor,
  Controller, Delete,
  Get,
  Param, ParseIntPipe,
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
import { MessageDto } from '../common/dto/message.dto';
import { AssignUserDto } from './dto/assign-user.dto';


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
  ): Promise<MessageDto> {
    await this.projectService.createProject(createDto, req.user.id);
    return new MessageDto('Proje başarıyla oluşturuldu');
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

  @Post(':projectId/assign-user')
  async assignUser(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: AssignUserDto,
  ): Promise<{ message: string }> {
    await this.projectService.assignUserToProject(projectId, dto);
    return { message: 'Kullanıcı projeye atandı' };
  }

  @Delete(':projectId/users/:userId')
  async removeUserFromProject(
    @Param('projectId') projectId: number,
    @Param('userId') userId: number
  ): Promise<MessageDto> {
    await this.projectService.removeUserFromProject(projectId, userId)
    return new MessageDto('Kullanıcı projeden çıkarıldı')
  }
}
