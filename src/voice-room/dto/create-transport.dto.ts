import { IsEnum, IsString } from 'class-validator';
import { TransportDirection } from '../voice-room.service';

enum Direction {
  SEND = 'send',
  RECV = 'recv',
}

export class CreateTransportDto {
  @IsEnum(Direction)
  direction!: TransportDirection;

  @IsString()
  peerId!: string;
}
