import { IsString, IsOptional } from 'class-validator'

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  recipientId?: string

  // Preferred: explicit buyer/seller ids so the conversation is always role-correct
  // regardless of who initiates (buyer or seller).
  @IsString()
  @IsOptional()
  buyerId?: string

  @IsString()
  @IsOptional()
  sellerId?: string

  @IsString()
  @IsOptional()
  orderId?: string
}
