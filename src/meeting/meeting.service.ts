import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Meeting } from './meeting.entity';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';
import { ProjectUser } from '../project/project-user.entity';
import { CreateMeetingDto, CreateMeetingResponseDto } from './dto/create-meeting.dto';
import { MeetingResponseDto, MeetingUserDto } from './dto/meeting-response.dto';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProjectUser)
    private readonly projectUserRepository: Repository<ProjectUser>,
  ) {}

  async createMeeting(
    projectId: number,
    dto: CreateMeetingDto,
    creator: { id: number },
  ): Promise<CreateMeetingResponseDto> {
    const { project, user: creatorUser } = await this.ensureProjectMembership(
      projectId,
      creator.id,
    );

    const scheduledAt = this.combineDateAndTime(dto.meetingDate, dto.meetingTime);

    const participantIds = dto.participantIds ?? [];
    let participants: User[] = [];

    if (participantIds.length > 0) {
      participants = await this.userRepository.find({
        where: { id: In(participantIds) },
      });

      if (participants.length !== participantIds.length) {
        throw new NotFoundException('One or more participants were not found');
      }

      const memberships = await this.projectUserRepository.find({
        where: participantIds.map((userId) => ({
          project: { id: projectId },
          user: { id: userId },
        })),
      });

      if (memberships.length !== participantIds.length) {
        throw new ForbiddenException('All participants must belong to the project');
      }
    }

    const meeting = this.meetingRepository.create({
      title: dto.title,
      location: dto.location,
      agenda: dto.agenda,
      notes: dto.notes,
      scheduledAt,
      project,
      createdBy: creatorUser,
      participants,
    });

    const savedMeeting = await this.meetingRepository.save(meeting);

    return {
      id: savedMeeting.id,
      title: savedMeeting.title,
      scheduledAt: savedMeeting.scheduledAt,
    };
  }

  async findByProject(
    projectId: number,
    requester: { id: number },
  ): Promise<MeetingResponseDto[]> {
    const { project } = await this.ensureProjectMembership(
      projectId,
      requester.id,
    );

    const meetings = await this.meetingRepository.find({
      where: { project: { id: project.id } },
      relations: ['createdBy', 'participants'],
    });

    return meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt,
      notes: meeting.notes ?? null,
      location: meeting.location ?? null,
      agenda: meeting.agenda,
      createdBy: meeting.createdBy
        ? this.toMeetingUserDto(meeting.createdBy)
        : null,
      participants: meeting.participants.map((participant) =>
        this.toMeetingUserDto(participant),
      ),
    }));
  }

  private combineDateAndTime(date: string, time: string): Date {
    const combined = new Date(`${date}T${time}`);
    if (Number.isNaN(combined.getTime())) {
      throw new BadRequestException('Invalid meeting date or time');
    }
    return combined;
  }

  private async ensureProjectMembership(
    projectId: number,
    userId: number,
  ): Promise<{ project: Project; user: User }> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.projectUserRepository.findOne({
      where: {
        project: { id: projectId },
        user: { id: user.id },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return { project, user };
  }

  private toMeetingUserDto(user: User): MeetingUserDto {
    const { id, firstName, lastName, email } = user;

    return { id, firstName, lastName, email };
  }
}
