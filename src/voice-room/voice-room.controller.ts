import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { VoiceRoomService } from './voice-room.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { ConnectTransportDto } from './dto/connect-transport.dto';
import { ProduceDto } from './dto/produce.dto';
import { ConsumeDto } from './dto/consume.dto';

@Controller('voice-room')
export class VoiceRoomController {
  constructor(private readonly voiceRoomService: VoiceRoomService) {}

  @Get('rooms/:roomId/state')
  getRoomState(@Param('roomId') roomId: string) {
    return this.voiceRoomService.getRoomState(roomId);
  }

  @Get('rooms/:roomId/rtp-capabilities')
  async getRouterRtpCapabilities(@Param('roomId') roomId: string) {
    return this.voiceRoomService.getRouterRtpCapabilities(roomId);
  }

  @Post('rooms/:roomId/transports')
  async createTransport(
    @Param('roomId') roomId: string,
    @Body() dto: CreateTransportDto,
  ) {
    const transport = await this.voiceRoomService.createWebRtcTransport(
      roomId,
      dto.peerId,
      dto.direction,
    );
    return transport;
  }

  @Post('rooms/:roomId/transports/connect')
  async connectTransport(
    @Param('roomId') roomId: string,
    @Body() dto: ConnectTransportDto,
  ) {
    await this.voiceRoomService.connectWebRtcTransport(
      roomId,
      dto.peerId,
      dto.transportId,
      dto.dtlsParameters,
    );
    return { status: 'connected' };
  }

  @Post('rooms/:roomId/producers')
  async produce(@Param('roomId') roomId: string, @Body() dto: ProduceDto) {
    const producer = await this.voiceRoomService.produce(
      roomId,
      dto.peerId,
      dto.transportId,
      dto.kind,
      dto.rtpParameters,
    );

    return {
      id: producer.id,
      kind: producer.kind,
    };
  }

  @Post('rooms/:roomId/consumers')
  async consume(@Param('roomId') roomId: string, @Body() dto: ConsumeDto) {
    const consumer = await this.voiceRoomService.consume(
      roomId,
      dto.peerId,
      dto.producerId,
      dto.rtpCapabilities,
    );

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      appData: consumer.appData,
      producerPaused: consumer.producerPaused,
    };
  }

  @Delete('rooms/:roomId/peers/:peerId')
  async closePeer(
    @Param('roomId') roomId: string,
    @Param('peerId') peerId: string,
  ) {
    await this.voiceRoomService.closePeer(roomId, peerId);
    return { status: 'left' };
  }
}
