import { WebSocketGateway } from '@nestjs/websockets'

@WebSocketGateway({ namespace: 'messages' })
export class MessagesGateway {}
