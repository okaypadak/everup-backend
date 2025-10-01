import { IsObject, IsString } from 'class-validator';
import { MediaKind, RtpParameters } from 'mediasoup/node/lib/types';

export class ProduceDto {
  @IsString()
  peerId!: string;

  @IsString()
  transportId!: string;

  @IsString()
  kind!: MediaKind;

  @IsObject()
  rtpParameters!: RtpParameters;
}
