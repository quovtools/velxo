import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { PrismaService } from '@/common/services/prisma.service'

@WebSocketGateway({
  namespace: 'messages',
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

  constructor(private prisma: PrismaService) {}

  afterInit() {
    this.logger.log('Messages WebSocket gateway initialized')
  }

  handleConnection(client: Socket) {
    client.on('join', (conversationId: string) => {
      if (conversationId) client.join(`conversation:${conversationId}`)
    })

    client.on('typing', async (data: { conversationId: string; userId: string }) => {
      if (!data?.conversationId || !data?.userId) return
      client.to(`conversation:${data.conversationId}`).emit('userTyping', { userId: data.userId })
      // Auto-clear typing after 3s
      setTimeout(() => {
        client.to(`conversation:${data.conversationId}`).emit('userTyping', { userId: data.userId, typing: false })
      }, 3000)
    })

    client.on('disconnect', async () => {
      const userId = (client.handshake.query?.userId as string) || (client.data as any)?.userId
      if (userId) {
        await this.prisma.users.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {})
      }
    })
  }

  handleDisconnect() {
    // no-op
  }

  emitToConversation(conversationId: string, event: string, payload: any) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload)
  }
}
