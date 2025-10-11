import type {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
  RtpCapabilities,
  AppData, // <-- önemli
} from 'mediasoup/node/lib/types';

export type Direction = 'send' | 'recv';

// İstersen aşağıdaki appData tiplerini yine kullanabilirsin; ancak
// mediasoup tarafında AppData = Record<string, unknown> beklendiği için
// map'lerde genel AppData kullanıyoruz.
export interface TransportMeta {
  peerId: string;
  direction: Direction;
}
export interface ProducerMeta { peerId: string; }
export interface ConsumerMeta { peerId: string; producerPeerId: string; }

export interface VoicePeer {
  id: string;
  username: string;
  muted: boolean;
  // Burada AppData kullanıyoruz (generic uyuşmazlığı yaşamamak için)
  transports: Map<string, WebRtcTransport<AppData>>;
  producers: Map<string, Producer<AppData>>;
  consumers: Map<string, Consumer<AppData>>;
}

export interface VoiceRoom {
  id: string;
  hostId?: string;
  locked: boolean;
  router: Router;
  audioLevelObserver: any;
  peers: Map<string, VoicePeer>;
  bannedPeerIds: Set<string>;
}

export interface JoinResult {
  roomId: string;
  clientId: string;
  isHost: boolean;
  routerRtpCapabilities: RtpCapabilities;
  participants: Array<{ id: string; username: string; muted: boolean; isHost: boolean }>;
  locked: boolean;
}

export type JwtUser = { id: string | number; role?: string; name?: string; email?: string; };
