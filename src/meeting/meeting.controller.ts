import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Request } from 'express';

@Controller('projects/:projectId/meetings')
@UseGuards(RolesGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  async createMeeting(
    @Param('projectId') projectId: string,
    @Body() createMeetingDto: CreateMeetingDto,
    @Req() req: Request,
  ) {
    return this.meetingService.createMeeting(+projectId, createMeetingDto, req.user as any);
  }
}
