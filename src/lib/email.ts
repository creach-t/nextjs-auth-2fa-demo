import nodemailer from 'nodemailer'
import { ENV, EMAIL_CONSTANTS } from './constants'
import type { EmailOptions } from '@/types/api'

/**
 * Email service for sending 2FA codes and other notifications
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter({
        host: ENV.EMAIL_HOST,
        port: ENV.EMAIL_PORT,
        secure: ENV.EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASS,
        },
        // For Gmail, you might need these additional options
        ...(ENV.EMAIL_HOST === 'smtp.gmail.com' && {
          service: 'gmail',
          tls: {
            rejectUnauthorized: false,
          },
        }),
      })
    }
    return this.transporter
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter()
      
      const mailOptions = {
        from: `${EMAIL_CONSTANTS.FROM_NAME} <${ENV.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  /**
   * Send 2FA verification code
   */
  static async send2FACode(email: string, code: string, expiryMinutes: number = 5): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de vérification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e9ecef;
          }
          .code-container {
            background: white;
            border: 2px solid #4f46e5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Code de Vérification</h1>
          <p>Next.js Auth 2FA Demo</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p>Voici votre code de vérification à deux facteurs :</p>
          
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul>
              <li>Ce code expire dans <strong>${expiryMinutes} minutes</strong></li>
              <li>Ne partagez jamais ce code avec qui que ce soit</li>
              <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
            </ul>
          </div>
          
          <p>Si vous rencontrez des difficultés, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>L'équipe Next.js Auth Demo</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>© 2025 Next.js Auth 2FA Demo. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Code de Vérification - Next.js Auth Demo
      
      Votre code de vérification : ${code}
      
      Ce code expire dans ${expiryMinutes} minutes.
      Ne partagez jamais ce code avec qui que ce soit.
      
      Si vous n'avez pas demandé ce code, ignorez cet email.
      
      L'équipe Next.js Auth Demo
    `

    return this.sendEmail({
      to: email,
      subject: EMAIL_CONSTANTS.SUBJECTS.TWOFA_CODE,
      html,
      text,
    })
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const displayName = name || 'Utilisateur'
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px;">
          <h1>🎉 Bienvenue ${displayName} !</h1>
          <p>Votre compte a été créé avec succès</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; margin-top: 20px; border-radius: 10px;">
          <p>Félicitations ! Votre compte Next.js Auth Demo a été créé avec succès.</p>
          
          <p><strong>Fonctionnalités disponibles :</strong></p>
          <ul>
            <li>✅ Authentification sécurisée</li>
            <li>✅ Protection à deux facteurs (2FA)</li>
            <li>✅ Gestion de profil</li>
            <li>✅ Sécurité avancée</li>
          </ul>
          
          <p>Vous pouvez maintenant vous connecter et explorer toutes les fonctionnalités.</p>
          
          <p>Merci de nous faire confiance !</p>
          
          <p>Cordialement,<br>L'équipe Next.js Auth Demo</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Bienvenue ${displayName} !
      
      Votre compte Next.js Auth Demo a été créé avec succès.
      
      Vous pouvez maintenant vous connecter et explorer toutes les fonctionnalités.
      
      Merci de nous faire confiance !
      
      L'équipe Next.js Auth Demo
    `

    return this.sendEmail({
      to: email,
      subject: EMAIL_CONSTANTS.SUBJECTS.WELCOME,
      html,
      text,
    })
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter()
      await transporter.verify()
      console.log('Email configuration is valid')
      return true
    } catch (error) {
      console.error('Email configuration error:', error)
      return false
    }
  }
}