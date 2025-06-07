import { Controller, Post, Body, Get, Param, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles('admin', 'director', 'developer', 'tester', 'devOps')
  async create(@Body() dto: CreateProjectDto, @Req() req): Promise<{ success: boolean; message: string }> {
    await this.projectService.create(dto, req.user);
    return { success: true, message: 'Proje başarıyla oluşturuldu.' };
  }

}
