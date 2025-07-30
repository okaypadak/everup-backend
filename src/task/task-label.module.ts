import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskLabel } from './task-label.entity';
import { TaskLabelService } from './task-label.service';
import { TaskLabelController } from './task-label.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskLabel])],
  providers: [TaskLabelService],
  controllers: [TaskLabelController],
  exports: [TaskLabelService],
})
export class TaskLabelModule {}
