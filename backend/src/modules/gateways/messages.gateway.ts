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
  namespace: 'messages',
  // Use the app's CORS_ORIGIN env var instead of a wildcard
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : true,
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagesGateway.name)

  @WebSocketServer()
  server: Server

  afterInit() {
    this.logger.log('Messages WebSocket gateway initialized')
  }

  handleConnection(client: Socket) {
    // Clients join a room named `conversation:<id>` to receive live updates.
    client.on('join', (conversationId: string) => {
      if (conversationId) client.join(`conversation:${conversationId}`)
    })
  }

  handleDisconnect() {
    // no-op
  }

  emitToConversation(conversationId: string, event: string, payload: any) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload)
  }
}
