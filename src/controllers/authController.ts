import { AuthService } from '../services/authService';
import { EmailService } from '../services/emailService';
import type { LoginInput, RegisterInput } from '../types';

const emailService = new EmailService();

function getDashboardPath(role: string): string {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'manager':
            return '/manager/dashboard';
        case 'collaborator':
            return '/collaborator/dashboard';
        case 'client':
            return '/client/dashboard';
        default:
            return '/dashboard';
    }
}

export class AuthController {
    authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(userData: RegisterInput) {
        const { user, token } = await this.authService.register(userData);

        await emailService.sendEmail(
            user.email,
            '¡Bienvenido a la App de Reporte de Novedades de Tu Profe de IA!',
            `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          <h2>👋 ¡Hola ${user.name || ''}!</h2>
          <p>Te damos la bienvenida a la <strong>App de Reporte de Novedades</strong> de <strong>Tu Profe de IA</strong>.</p>
          <p>Gracias por confiar en nosotros para mejorar la gestión de tus aplicaciones. Desde esta app podrás reportar fácilmente cualquier incidente o solicitud relacionada con tu proyecto.</p>
          <hr />
          <p>
            <a href="https://task-master-ia-app.vercel.app/" target="_blank" style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #2563eb;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              👉 Acceder a la App
            </a>
          </p>

          <p><strong>Estas son tus credenciales de acceso:</strong></p>
          <ul>
            <li><strong>Usuario:</strong> ${user.email}</li>
            <li><strong>Contraseña:</strong> app123</li>
          </ul>
          <p>⚠️ Te recomendamos cambiar tu contraseña después del primer ingreso.</p>
          <hr />
          
          <p>Si tienes preguntas o necesitas ayuda, no dudes en responder a este correo.</p>
          <p>¡Bienvenido a bordo!</p>
          <p>– John Páez<br/>CEO & Founder – Tu Profe de IA</p>
        </div>
      `
        );

        return {
            message: 'User registered successfully',
            user: user,
            token
        };
    }

    async login(credentials: LoginInput) {
        const { user, token } = await this.authService.login(credentials);
        const redirectTo = getDashboardPath(user.role);

        return {
            message: 'Logged in successfully',
            user: user,
            token: token,
            redirectTo: redirectTo
        };
    }

    async getMe(userId: string) {
        const userFromDb = await this.authService.getMe(userId);

        if (!userFromDb) {
            throw new Error('User not found.');
        }

        return { user: userFromDb };
    }

    async forgotPassword(email: string) {
        if (!email || typeof email !== 'string') {
            throw new Error('Email is required.');
        }
        await this.authService.forgotPassword(email);
        return {
            message: 'If an account with that email exists, a password reset link has been sent.'
        };
    }

    async resetPassword(token: string, newPassword: string) {
        if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
            throw new Error('Token and new password are required.');
        }
        await this.authService.resetPassword(token, newPassword);
        return {
            message: 'Password has been reset successfully.'
        };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        await this.authService.changePassword(userId, currentPassword, newPassword);
        return { message: 'Password changed successfully.' };
    }
}
