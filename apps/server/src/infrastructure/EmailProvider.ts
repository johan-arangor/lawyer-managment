import nodemailer from 'nodemailer';

export class EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
      },
    });
  }

  async sendConfirmationEmail(email: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/confirm-account?token=${token}`;

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to: email,
      subject: 'Bienvenido a Enlace Jurídico - Firma de Abogados',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #0f172a;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Se ha creado una cuenta para ti en el sistema de gestión del bufete <b>Enlace Jurídico</b>. 
            Para comenzar a gestionar tus trámites, por favor confirma tu cuenta y establece tu contraseña segura.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" style="background-color: #fbbf24; color: #0f172a; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              ACTIVAR MI CUENTA
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            Si no esperabas este correo, puedes ignorarlo. El enlace expirará en 24 horas.
          </p>
        </div>
      `,
    };

    return this.sendMail(mailOptions);
  }

  async sendResetPasswordEmail(email: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to: email,
      subject: 'Recuperar Contraseña - Enlace Jurídico',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #0f172a;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar con el proceso.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" style="background-color: #0f172a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              REESTABLECER CONTRASEÑA
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.
          </p>
        </div>
      `,
    };

    return this.sendMail(mailOptions);
  }

  async sendStatusUpdateEmail(email: string, name: string, caseTitle: string, oldStatus: string, newStatus: string, reason: string) {
    const mailOptions = {
      from: `"Notificaciones Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to: email,
      subject: `Actualización de Estado: ${caseTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #0f172a; color: #fbbf24; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
              ENLACE JURÍDICO
            </div>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            Te informamos que tu caso <b>"${caseTitle}"</b> ha tenido una actualización en su estado jurídico.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #fbbf24; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-size: 12px; font-weight: bold; padding-bottom: 5px; text-transform: uppercase;">Estado Anterior</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 16px; font-weight: bold; text-decoration: line-through; padding-bottom: 15px;">${oldStatus}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12px; font-weight: bold; padding-bottom: 5px; text-transform: uppercase;">Nuevo Estado</td>
              </tr>
              <tr>
                <td style="color: #0f172a; font-size: 20px; font-weight: bold; padding-bottom: 15px;">${newStatus}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12px; font-weight: bold; padding-bottom: 5px; text-transform: uppercase;">Motivo / Detalle</td>
              </tr>
              <tr>
                <td style="color: #475569; font-size: 14px; font-style: italic; background-color: #ffffff; padding: 10px; border-radius: 4px;">"${reason}"</td>
              </tr>
            </table>
          </div>

          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            Puedes consultar más detalles y descargar documentación relacionada ingresando a nuestro portal con tus credenciales.
          </p>
          
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Bufete "Enlace Jurídico" - Compromiso con la excelencia legal.
            </p>
          </div>
        </div>
      `,
    };

    return this.sendMail(mailOptions);
  }

  private async sendMail(options: any) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        if (process.env.NODE_ENV === 'test' || !process.env.SMTP_USER) {
          console.log(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
          return { messageId: 'mock-id' };
        }

        const info = await this.transporter.sendMail(options);

        // Log success in DB
        await prisma.emailLog.create({
          data: {
            to: options.to,
            subject: options.subject,
            status: 'SENT',
            attempts: attempts
          }
        });

        return info;
      } catch (error: any) {
        lastError = error.message;
        console.error(`Email attempt ${attempts} failed:`, error.message);

        if (attempts === maxAttempts) {
          // Log final failure in DB
          await prisma.emailLog.create({
            data: {
              to: options.to,
              subject: options.subject,
              status: 'FAILED',
              attempts: attempts,
              error: lastError
            }
          });
          throw new Error(`Failed to send email after ${maxAttempts} attempts: ${lastError}`);
        }

        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }
}
