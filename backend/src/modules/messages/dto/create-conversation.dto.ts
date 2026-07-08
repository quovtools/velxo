import { IsString } from 'class-validator'

export class CreateConversationDto {
  @IsString()
  recipientId: string

  @IsString()
  @IsOptional()
  orderId?: string
}
