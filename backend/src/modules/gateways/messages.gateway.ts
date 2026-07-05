import { WebSocketGateway } from '@nestjs/common'

@WebSocketGateway({ namespace: 'messages' })
export class MessagesGateway {}
