import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  namespace: 'notifications',
  // Use the app's CORS_ORIGIN env var instead of a wildcard
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : true,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server: Server

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Notifications WebSocket gateway initialized')
  }

  /**
   * FIX #6: Verify the JWT token from the socket handshake auth before
   * allowing a client to subscribe to any user's notification room.
   * Previously the client sent its own userId with no verification, letting
   * anyone subscribe to any user's real-time events.
   */
  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as Record<string, any>)?.token ||
      (client.handshake.headers?.authorization as string)?.replace('Bearer ', '')

    if (!token) {
      this.logger.warn(`WS notifications: client ${client.id} connected without a token`)
      client.disconnect(true)
      return
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'velxo-fallback-secret-change-in-prod'
      const payload = this.jwtService.verify(token, { secret }) as any
      const userId: string = payload.sub || payload.userId

      if (!userId) {
        client.disconnect(true)
        return
      }

      // Join the verified user's notification room
      client.join(`user:${userId}`)
      this.logger.log(`WS notifications: client ${client.id} authenticated as user ${userId}`)
    } catch {
      this.logger.warn(`WS notifications: client ${client.id} sent invalid/expired token`)
      client.disconnect(true)
    }
  }

  handleDisconnect() {
    // no-op
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server?.to(`user:${userId}`).emit(event, payload)
  }
}
