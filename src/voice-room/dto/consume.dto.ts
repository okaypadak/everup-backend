import { IsObject, IsString } from 'class-validator';
import { RtpCapabilities } from 'mediasoup/node/lib/types';

export class ConsumeDto {
  @IsString()
  peerId!: string;

  @IsString()
  producerId!: string;

  @IsObject()
  rtpCapabilities!: RtpCapabilities;
}
