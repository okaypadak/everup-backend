import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { User } from '../user/user.entity';
import { ProjectUser } from './project-user.entity';
import { Task } from '../task/task.entity';
import { Comment } from '../comment/comment.entity';
import { Meeting } from '../meeting/meeting.entity';
import { Sprint } from '../sprint/sprint.entity';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, ProjectUser, Task, Comment, Meeting, Sprint]),
    DocumentModule,
  ],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService]
})
export class ProjectModule {}
