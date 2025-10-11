import { Module } from '@nestjs/common';
import { VoiceRoomService } from './voice-room.service';
import { VoiceRoomGateway } from './voice-room.gateway';
import { VoiceRoomController } from './voice-room.controller';

@Module({
  providers: [VoiceRoomService, VoiceRoomGateway],
  controllers: [VoiceRoomController],
  exports: [VoiceRoomService],
})
export class VoiceRoomModule {}
