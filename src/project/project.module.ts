import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { User } from '../user/user.entity';
import { ProjectUser } from './project-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, User, ProjectUser])],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService]
})
export class ProjectModule {}
