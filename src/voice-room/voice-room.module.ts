import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoiceRoomService } from './voice-room.service';
import { VoiceRoomController } from './voice-room.controller';

@Module({
  imports: [ConfigModule],
  controllers: [VoiceRoomController],
  providers: [VoiceRoomService],
  exports: [VoiceRoomService],
})
export class VoiceRoomModule {}
