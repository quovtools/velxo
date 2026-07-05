import { ApiProperty } from '@nestjs/swagger'
import { CreateListingDto as BaseDto } from './create-listing.dto'

export class SearchListingsDto {
  @ApiProperty({ required: false }) gameName?: string
  @ApiProperty({ required: false }) categoryId?: string
  @ApiProperty({ required: false }) region?: string
  @ApiProperty({ required: false }) platform?: string
  @ApiProperty({ required: false }) minPrice?: number
  @ApiProperty({ required: false }) maxPrice?: number
  @ApiProperty({ required: false }) sort?: string
  @ApiProperty({ required: false, minimum: 1 }) limit?: number
  @ApiProperty({ required: false, minimum: 0 }) offset?: number
}
