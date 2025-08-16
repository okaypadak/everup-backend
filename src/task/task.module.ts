import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { Comment } from '../comment/comment.entity';
import { TaskDependency } from './task-dependency.entity';
import { TaskLabel } from './task-label.entity';
import { NotificationModule } from '../notification/notification.module';
import { Sprint } from '../sprint/sprint.entity'; // ✅ EKLENDİ

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskLabel,
      User,
      Project,
      Comment,
      TaskDependency,
      Sprint,
    ]),
    NotificationModule,
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
