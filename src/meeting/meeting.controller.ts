import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Request } from 'express';
import { MeetingResponseDto } from './dto/meeting-response.dto';

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

  @Get()
  async getProjectMeetings(
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ): Promise<MeetingResponseDto[]> {
    return this.meetingService.findByProject(+projectId, req.user as any);
  }
}
