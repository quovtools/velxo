import { Controller, Get, Post, UseGuards, Body, Param, Request } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversation/:conversationId')
  @UseGuards(JwtAuthGuard)
  findConversation(@Param('conversationId') conversationId: string) {
    return this.messagesService.findConversation(conversationId)
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  send(@Request() req, @Body() dto: any) {
    return this.messagesService.send(req.user.sub, dto)
  }
}
