import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20

  // FIX #29: Added @IsOptional() and @Type so query param validation works.
  // `skip` is kept for backward compat but is unused — use the `offset` getter.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number

  get offset(): number {
    return (this.page - 1) * this.limit
  }
}
