import { Database } from '@prisma/client'

declare module '@prisma/client' {
  export interface PrismaClient {
    users: any
  }
}

export type { Database }
