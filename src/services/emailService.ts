import { Resend } from 'resend';
import { env } from '../config/environment';
import { logger } from '../config/logger';

export class EmailService {
    resend: Resend;

    constructor() {
        if (!env.RESEND_API_KEY) {
            logger.warn('RESEND_API_KEY is not set. Email service will be disabled');
        }
        this.resend = new Resend(env.RESEND_API_KEY);
    }

    async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
        if (!env.RESEND_API_KEY) {
            logger.info({ to, subject }, 'Skipping email (RESEND_API_KEY not set)');
            return;
        }
        try {
            const { data, error } = await this.resend.emails.send({
                from: 'TaskMaster IA <no-reply@tuprofedeia.com.co>',
                to: [to],
                subject: subject,
                html: htmlContent,
                text: textContent,
            });

            if (error) {
                logger.error({ err: error }, 'Failed to send email');
                throw new Error(`Failed to send email: ${error.message}`);
            }
            logger.info({ data }, 'Email sent successfully');
            return data;
        } catch (error) {
            logger.error({ err: error }, 'Error in EmailService.sendEmail');
            throw error;
        }
    }

    async sendWelcomeEmail(toEmail: string, username: string) {
        const subject = 'Welcome to TaskMaster IA!';
        const htmlContent = `
      <h1>Welcome, ${username}!</h1>
      <p>Thank you for joining TaskMaster IA. We're excited to help you manage your tasks efficiently.</p>
      <p>Best regards,<br>The TaskMaster IA Team</p>
    `;
        const textContent = `Welcome, ${username}!\nThank you for joining TaskMaster IA.\nBest regards,\nThe TaskMaster IA Team`;
        await this.sendEmail(toEmail, subject, htmlContent, textContent);
    }

    async sendPasswordResetEmail(toEmail: string, resetLink: string) {
        const subject = 'Password Reset Request for TaskMaster IA';
        const htmlContent = `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your TaskMaster IA account.</p>
      <p>Click on the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
        const textContent = `Password Reset Request for TaskMaster IA. Click the link: ${resetLink}`;
        await this.sendEmail(toEmail, subject, htmlContent, textContent);
    }

    async sendNotificationEmail(toEmail: string, notificationSubject: string, notificationMessage: string, userName?: string) {
        const subject = `Notificación de TaskMaster IA: ${notificationSubject}`;
        const htmlContent = `
      <p>Hola ${userName || 'usuario'},</p>
      <p>${notificationMessage}</p>
      <p>Puedes revisar tus notificaciones en la aplicación.</p>
      <p>Saludos,<br>El equipo de TaskMaster IA</p>
    `;
        const textContent = `Hola ${userName || 'usuario'},\n${notificationMessage}\nPuedes revisar tus notificaciones en la aplicación.\n\nSaludos,\nEl equipo de TaskMaster IA`;

        const result = await this.sendEmail(toEmail, subject, htmlContent, textContent);
        if (result && 'error' in result) {
            logger.error({ toEmail, err: result.error }, 'Failed to send notification email');
        }
    }

    async sendTaskConfirmationEmail(user: any, task: any) {
        const subject = `Confirmación de Tarea #${task.id}: ${task.title}`;
        const htmlContent = `
      <h1>Hola ${user.name},</h1>
      <p>Hemos recibido tu solicitud de tarea y ya estamos trabajando en ella.</p>
      <h2>Detalles de la Tarea:</h2>
      <ul>
        <li><strong>ID de Tarea:</strong> ${task.id}</li>
        <li><strong>Título:</strong> ${task.title}</li>
        <li><strong>Descripción:</strong> ${task.description}</li>
        <li><strong>Tipo:</strong> ${task.type}</li>
        <li><strong>Prioridad Asignada:</strong> ${task.priority}</li>
      </ul>
      <p>Puedes ver el estado de tu tarea en cualquier momento desde tu dashboard.</p>
      <p>Saludos,<br>El equipo de TaskMaster IA</p>
    `;
        const textContent = `Hola ${user.name},\nHemos recibido tu solicitud de tarea.\nID de Tarea: ${task.id}\nTítulo: ${task.title}\n\nGracias,\nEl equipo de TaskMaster IA`;

        await this.sendEmail(user.email, subject, htmlContent, textContent);
    }
}
