import { IsObject, IsString } from 'class-validator';
import { DtlsParameters } from 'mediasoup/node/lib/types';

export class ConnectTransportDto {
  @IsString()
  peerId!: string;

  @IsString()
  transportId!: string;

  @IsObject()
  dtlsParameters!: DtlsParameters;
}
