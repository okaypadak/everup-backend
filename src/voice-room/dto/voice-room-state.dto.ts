export class VoiceRoomStateDto {
  roomId!: string;
  participants!: Array<{ id: string; username: string; muted: boolean; isHost: boolean }>;
  hostId?: string;
  locked!: boolean;
}
