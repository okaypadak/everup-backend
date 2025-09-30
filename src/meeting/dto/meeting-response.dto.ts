export class MeetingUserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export class MeetingResponseDto {
  id: number;
  title: string;
  scheduledAt: Date;
  notes: string | null;
  location: string | null;
  agenda: string;
  createdBy: MeetingUserDto | null;
  participants: MeetingUserDto[];
}
