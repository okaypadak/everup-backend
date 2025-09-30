import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './meeting.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project/project-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting, Project, User, ProjectUser])],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
