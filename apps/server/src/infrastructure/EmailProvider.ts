import nodemailer from 'nodemailer';
import { prisma } from './prisma';

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

  private getBaseUrl(source?: string): string {
    if (source === 'web') {
      return process.env.FRONTEND_URL_WEB || 'http://localhost:5173';
    }
    return process.env.FRONTEND_URL || 'http://localhost:5175';
  }

  async sendConfirmationEmail(email: string, name: string, token: string, source?: string) {
    const baseUrl = this.getBaseUrl(source);
    const path = source === 'web' ? 'confirmar-cuenta' : 'confirm-account';
    const url = source === 'web'
      ? `${baseUrl}/#/${path}?token=${token}`
      : `${baseUrl}/${path}?token=${token}`;

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to: email,
      subject: 'Bienvenido a Enlace Jurídico - Firma de Abogados',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a237e;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Se ha creado una cuenta para ti en el sistema de gestión del bufete <b>Enlace Jurídico</b>. 
            Para comenzar a gestionar tus trámites, por favor confirma tu cuenta y establece tu contraseña segura.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" style="background-color: #b39b72; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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

  async sendResetPasswordEmail(email: string, name: string, token: string, source?: string) {
    const baseUrl = this.getBaseUrl(source);
    const url = source === 'web'
      ? `${baseUrl}/#/reset-password?token=${token}`
      : `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to: email,
      subject: 'Recuperar Contraseña - Enlace Jurídico',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a237e;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar con el proceso.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" style="background-color: #1a237e; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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
            <div style="display: inline-block; background-color: #1a237e; color: #b39b72; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
              ENLACE JURÍDICO
            </div>
          </div>
          <h2 style="color: #1a237e; margin-top: 0;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            Te informamos que tu caso <b>"${caseTitle}"</b> ha tenido una actualización en su estado jurídico.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #b39b72; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
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
                <td style="color: #1a237e; font-size: 20px; font-weight: bold; padding-bottom: 15px;">${newStatus}</td>
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

  async sendAppointmentRequestEmail(to: string, name: string, serviceName: string, date: string, lawyerName?: string) {
    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to,
      subject: 'Solicitud de Cita Recibida - Enlace Jurídico',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a237e;">Hola, ${name}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hemos recibido tu solicitud para agendar una cita de <b>${serviceName}</b>.
          </p>
          <div style="background-color: #f1f3f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1a237e;"><b>Fecha y Hora:</b> ${date}</p>
            <p style="margin: 5px 0 0 0; color: #1a237e;"><b>Abogado:</b> ${lawyerName || 'Por asignar'}</p>
          </div>
          <p style="color: #475569;">
            Tu cita está en estado <b>PENDIENTE DE CONFIRMACIÓN</b>. En breve un abogado revisará la solicitud y recibirás un correo confirmando la cita.
          </p>
        </div>
      `,
    };
    return this.sendMail(mailOptions);
  }

  async sendAppointmentConfirmationEmail(to: string, name: string, serviceName: string, date: string, lawyerName: string, startTime: string, endTime: string) {
    const startIso = new Date(startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const endIso = new Date(endTime).toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(`Cita: ${serviceName}`);
    const details = encodeURIComponent(`Cita legal con ${lawyerName} en Enlace Jurídico.`);

    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startTime}&enddt=${endTime}&body=${details}`;

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to,
      subject: 'Cita Confirmada - Enlace Jurídico',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a237e;">¡Cita Confirmada, ${name}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Tu cita para <b>${serviceName}</b> ha sido confirmada por el abogado <b>${lawyerName}</b>.
          </p>
          <div style="background-color: #1a237e; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px;"><b>${date}</b></p>
          </div>
          <p style="color: #475569;">Agrega esta cita a tu calendario para no olvidarla:</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <a href="${googleUrl}" style="background-color: #ffffff; border: 1px solid #e2e8f0; color: #4285F4; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">+ Google Calendar</a>
            <a href="${outlookUrl}" style="background-color: #ffffff; border: 1px solid #e2e8f0; color: #0078D4; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">+ Outlook</a>
          </div>
        </div>
      `,
    };
    return this.sendMail(mailOptions);
  }

  async sendAppointmentNotificationLawyer(to: string, lawyerName: string, clientName: string, serviceName: string, date: string) {
    const adminUrl = process.env.FRONTEND_URL;
    const mailOptions = {
      from: `"Sistema Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to,
      subject: 'Nueva Solicitud de Cita - Acción Requerida',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a237e;">Hola, ${lawyerName}</h2>
          <p style="color: #475569;">
            Tienes una nueva solicitud de cita pendiente de confirmación.
          </p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b39b72;">
            <p style="margin: 0;"><b>Cliente:</b> ${clientName}</p>
            <p style="margin: 5px 0;"><b>Servicio:</b> ${serviceName}</p>
            <p style="margin: 5px 0;"><b>Fecha:</b> ${date}</p>
          </div>
          <p style="color: #475569;">
            Por favor ingresa a <b>Mi Agenda</b> en el portal administrativo para confirmar, modificar o cancelar esta cita.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${adminUrl}/dashboard/agenda" style="background-color: #1a237e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">IR A MI AGENDA</a>
          </div>
        </div>
      `,
    };
    return this.sendMail(mailOptions);
  }

  async sendAppointmentUpdateEmail(to: string, name: string, serviceName: string, date: string, status: string, notes?: string) {
    const statusText = status === 'CANCELLED' ? 'CANCELADA' : 'MODIFICADA';
    const color = status === 'CANCELLED' ? '#c62828' : '#f57c00';

    const mailOptions = {
      from: `"Enlace Jurídico" <${process.env.SMTP_USER || 'no-reply@enlacejuridico.com'}>`,
      to,
      subject: `Cita ${statusText} - Enlace Jurídico`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px;">
          <h2 style="color: ${color};">Tu cita ha sido ${statusText.toLowerCase()}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Te informamos que tu cita para <b>${serviceName}</b> programada para el <b>${date}</b> ha sido ${statusText.toLowerCase()}.
          </p>
          ${notes ? `<div style="background-color: #f1f3f8; padding: 15px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #475569;">"${notes}"</div>` : ''}
          <p style="color: #475569;">
            Si deseas agendar una nueva cita, por favor visita nuestro sitio web o contáctanos directamente.
          </p>
        </div>
      `,
    };
    return this.sendMail(mailOptions);
  }

  private async sendMail(options: any) {
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
