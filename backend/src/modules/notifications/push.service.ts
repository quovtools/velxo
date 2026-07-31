import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '@/common/services/prisma.service'
import { NotificationType } from '@prisma/client'

// web-push is optional — only loaded when VAPID keys are configured.
// This keeps the app bootable without the dependency installed.
// @ts-ignore
let webpush: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webpush = require('web-push')
} catch {
  // package not installed — push sending will be a no-op
}

const DEFAULT_PREFERENCES: Record<NotificationType, boolean> = {
  ORDER_STATUS: true,
  MESSAGE: true,
  DISPUTE: true,
  WITHDRAWAL: true,
  LISTING_APPROVED: true,
  LISTING_REJECTED: true,
  KYC_APPROVED: true,
  KYC_REJECTED: true,
  FRAUD_ALERT: true,
  SYSTEM: false,
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name)
  private vapidConfigured = false

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@piyrox.shop'

    if (webpush && publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey)
        this.vapidConfigured = true
        this.logger.log('Web Push: VAPID keys configured ✓')
      } catch (err: any) {
        this.logger.warn(`Web Push: VAPID setup failed — ${err.message}`)
      }
    } else {
      this.logger.warn(
        'Web Push: disabled — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT to enable.',
      )
    }
  }

  /**
   * Send a push notification to all active subscriptions for a user.
   * Returns the number of successfully dispatched messages.
   * Expired/gone subscriptions (HTTP 410/404) are automatically removed.
   */
  async sendPushToUser(
    userId: string,
    payload: { title: string; body: string; icon?: string; data?: Record<string, any> },
  ): Promise<number> {
    if (!this.vapidConfigured || !webpush) return 0

    const subs = await this.prisma.pushSubscriptions.findMany({ where: { userId } })
    if (!subs.length) return 0

    let sent = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/logo.png',
            data: {
              url: '/',
              ...payload.data,
            },
          }),
        )
        sent++
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status
        if (status === 410 || status === 404) {
          // Subscription expired — remove it silently
          await this.prisma.pushSubscriptions.delete({ where: { id: sub.id } }).catch(() => {})
          this.logger.debug(`Removed expired push subscription ${sub.id} for user ${userId}`)
        } else {
          this.logger.warn(`Push send failed for sub ${sub.id}: ${err.message ?? err}`)
        }
      }
    }

    return sent
  }

  async getUserPreferences(userId: string): Promise<Record<NotificationType, boolean>> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    })
    return (user?.notificationPreferences as Record<NotificationType, boolean>) ?? DEFAULT_PREFERENCES
  }

  async updateUserPreferences(
    userId: string,
    prefs: Partial<Record<NotificationType, boolean>>,
  ): Promise<Record<NotificationType, boolean>> {
    const current = await this.getUserPreferences(userId)
    const merged = { ...current, ...prefs }
    await this.prisma.users.update({
      where: { id: userId },
      data: { notificationPreferences: merged },
    })
    return merged
  }
}
