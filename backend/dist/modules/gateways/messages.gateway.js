"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let MessagesGateway = MessagesGateway_1 = class MessagesGateway {
    constructor() {
        this.logger = new common_1.Logger(MessagesGateway_1.name);
    }
    afterInit() {
        this.logger.log('Messages WebSocket gateway initialized');
    }
    handleConnection(client) {
        client.on('join', (conversationId) => {
            if (conversationId)
                client.join(`conversation:${conversationId}`);
        });
    }
    handleDisconnect() {
    }
    emitToConversation(conversationId, event, payload) {
        this.server?.to(`conversation:${conversationId}`).emit(event, payload);
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
exports.MessagesGateway = MessagesGateway = MessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'messages',
        cors: { origin: '*', credentials: true },
    })
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map