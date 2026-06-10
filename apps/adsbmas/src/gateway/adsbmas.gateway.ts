import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws/aircraft',
})
export class AdsbmasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`ADSBMAS WebSocket Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`ADSBMAS WebSocket Client disconnected: ${client.id}`);
  }

  broadcastAircraft(state: any) {
    if (this.server) {
      this.server.emit('aircraft-update', state);
    }
  }

  broadcastAlert(alert: any) {
    if (this.server) {
      this.server.emit('geofence-alert', alert);
    }
  }
}
