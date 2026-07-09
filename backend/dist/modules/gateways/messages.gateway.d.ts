import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(): void;
    emitToConversation(conversationId: string, event: string, payload: any): void;
}
