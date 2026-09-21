import { Controller, Get, Param } from '@nestjs/common'
import { GamesService } from './games.service'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  /** GET /games — public, canonical list of supported games with live info. */
  @Get()
  listGames() {
    const games = this.gamesService.listGames()
    return ApiResponseDto.ok(games, 'Games retrieved')
  }

  /** GET /games/:slug — public, single game config by slug or name. */
  @Get(':slug')
  getGame(@Param('slug') slug: string) {
    const game = this.gamesService.getGame(slug)
    return ApiResponseDto.ok(game, 'Game retrieved')
  }
}
