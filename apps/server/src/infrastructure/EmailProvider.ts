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
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-account?token=${token}`;
    
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
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
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

  private async sendMail(options: any) {
    try {
      if (process.env.NODE_ENV === 'test' || !process.env.SMTP_USER) {
        console.log('--- LOG DE COOREO (MOCK) ---');
        console.log(`Para: ${options.to}`);
        console.log(`Asunto: ${options.subject}`);
        console.log(`Contenido: Ver consola o variables de entorno.`);
        return { messageId: 'mock-id' };
      }
      return await this.transporter.sendMail(options);
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('No se pudo enviar el correo de notificación.');
    }
  }
}
