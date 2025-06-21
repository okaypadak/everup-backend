import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { Comment } from '../comment/comment.entity';
import { TaskDependency } from './task-dependency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Project, Comment, TaskDependency])],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService]
})
export class TaskModule {}
