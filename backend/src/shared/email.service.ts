import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY is NOT set. Emails will NOT be sent. Set RESEND_API_KEY in your environment.',
      );
    }
    this.resend = apiKey ? new Resend(apiKey) : null;
    // Resend only allows sending from a verified domain. Until the sender domain
    // is verified in the Resend dashboard, use the built-in test sender.
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.resend) {
      this.logger.error(
        `[EMAIL NOT SENT] RESEND_API_KEY missing. Would have sent "${subject}" to ${to}`,
      );
      return { success: false, error: 'Email service is not configured (missing RESEND_API_KEY).' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Email error to ${to}:`, error.message);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email sent to ${to}: ${subject} (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      this.logger.error(`Email sending failed to ${to}:`, err);
      return { success: false, error: err?.message || 'Unknown email error' };
    }
  }

  // Email Templates
  async sendVerificationEmail(email: string, verificationToken: string): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Velxo Account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 40px 30px;">
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 28px; font-weight: 800;">Welcome to Velxo!</h1>
                    <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                      Thank you for joining Africa's #1 gaming marketplace. Please verify your email address to complete your registration.
                    </p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
                      Verify Email Address
                    </a>
                    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; background-color: #0f172a; text-align: center;">
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                      If you didn't create an account with Velxo, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result = await this.sendEmail(email, 'Verify Your Velxo Account', html);
    return { success: result.success, error: result.error };
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://market.velxo.shop'}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Velxo Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 40px 30px;">
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 28px; font-weight: 800;">Reset Your Password</h1>
                    <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your Velxo account password. Click the button below to create a new password.
                    </p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; transition: background-color 0.2s;">
                      Reset Password
                    </a>
                    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
                    </p>
                    <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                      This link will expire in 24 hours for your security.<br>
                      If you didn't request a password reset, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result = await this.sendEmail(email, 'Reset Your Velxo Password', html);
    return { success: result.success, error: result.error };
  }

  async sendOrderConfirmationEmail(
    email: string, 
    orderNumber: string, 
    sellerName: string,
    totalAmount: number,
    items: Array<{ title: string; quantity: number; price: number }>
  ): Promise<{ success: boolean }> {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
          <p style="margin: 0 0 4px 0; color: #e2e8f0; font-size: 14px; font-weight: 500;">${item.title}</p>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">
          <p style="margin: 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">$${(item.quantity * item.price).toFixed(2)}</p>
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation - Velxo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 40px 30px;">
                    <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 28px; font-weight: 800;">Order Confirmed!</h1>
                    <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                      Thank you for your purchase! Your order has been placed successfully.
                    </p>
                    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 14px;">Order Number</p>
                        <p style="margin: 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">${orderNumber}</p>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <p style="margin: 0; color: #94a3b8; font-size: 14px;">Seller</p>
                        <p style="margin: 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">${sellerName}</p>
                      </div>
                    </div>
                    <table style="width: 100%; margin-bottom: 24px;" cellspacing="0" cellpadding="0" border="0">
                      ${itemsHtml}
                    </table>
                    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; text-align: right;">
                      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 14px;">Total Amount</p>
                      <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">$${totalAmount.toFixed(2)}</p>
                    </div>
                    <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                      Your items will be delivered according to the seller's timeline. If you have any questions, please contact the seller through the Velxo app.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result = await this.sendEmail(email, `Order ${orderNumber} Confirmed - Velxo`, html);
    return { success: result.success };
  }

  async sendWalletTransactionEmail(
    email: string,
    transactionType: string,
    amount: number,
    balanceAfter: number,
    description: string
  ): Promise<{ success: boolean }> {
    const isCredit = transactionType === 'CREDIT' || transactionType === 'REFUND';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Wallet Transaction - Velxo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 40px 30px;">
                    <div style="width: 60px; height: 60px; ${isCredit ? 'background-color: #10b981;' : 'background-color: #f59e0b;'} border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1v22M1 12h22" stroke="white" stroke-width="3" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 28px; font-weight: 800;">${transactionType === 'CREDIT' || transactionType === 'REFUND' ? 'Payment Received!' : 'Payment Sent'}</h1>
                    <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                      ${description}
                    </p>
                    <div style="background-color: #0f172a; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 30px;">
                      <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 14px;">Transaction Amount</p>
                      <p style="margin: 0 0 24px 0; color: ${isCredit ? '#10b981' : '#f59e0b'}; font-size: 32px; font-weight: 800;">
                        ${isCredit ? '+' : '-'}$${amount.toFixed(2)}
                      </p>
                      <p style="margin: 0; color: #94a3b8; font-size: 14px;">Your Current Balance</p>
                      <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">$${balanceAfter.toFixed(2)}</p>
                    </div>
                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                      Your wallet balance has been updated. You can view your transaction history in your Velxo wallet.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result = await this.sendEmail(email, `Wallet Transaction - Velxo`, html);
    return { success: result.success };
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    body: string
  ): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Notification - Velxo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 40px 30px;">
                    <h1 style="margin: 0 0 20px 0; color: #ffffff; font-size: 28px; font-weight: 800;">${title}</h1>
                    <p style="margin: 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">${body}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result = await this.sendEmail(email, title, html);
    return { success: result.success };
  }
}
