import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Sprint } from './sprint.entity'
import { SprintService } from './sprint.service'
import { SprintController } from './sprint.controller'
import { ProjectSprintController } from './project-sprint.controller'
import { Project } from '../project/project.entity'
import { Task } from '../task/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Project, Task])],
  providers: [SprintService],
  controllers: [SprintController, ProjectSprintController],
  exports: [SprintService],
})
export class SprintModule {}
