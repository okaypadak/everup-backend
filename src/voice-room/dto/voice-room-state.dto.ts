import { MediaKind } from 'mediasoup/node/lib/types';

export interface VoiceRoomProducerStateDto {
  id: string;
  kind: MediaKind;
}

export interface VoiceRoomConsumerStateDto {
  id: string;
  producerId: string;
  kind: MediaKind;
}

export interface VoiceRoomPeerStateDto {
  peerId: string;
  producers: VoiceRoomProducerStateDto[];
  consumers: VoiceRoomConsumerStateDto[];
}

export interface VoiceRoomStateDto {
  roomId: string;
  peers: VoiceRoomPeerStateDto[];
}
