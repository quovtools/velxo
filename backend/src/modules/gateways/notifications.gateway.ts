import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server: Server

  afterInit() {
    this.logger.log('Notifications WebSocket gateway initialized')
  }

  handleConnection(client: Socket) {
    // The client authenticates with its user id so we can join it to a
    // per-user room and push targeted notifications in real time.
    client.on('authenticate', (userId: string) => {
      if (userId) client.join(`user:${userId}`)
    })
    client.on('join', (userId: string) => {
      if (userId) client.join(`user:${userId}`)
    })
  }

  handleDisconnect() {
    // no-op
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server?.to(`user:${userId}`).emit(event, payload)
  }
}
