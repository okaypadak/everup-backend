import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CustomMailService {
  constructor(private mailerService: MailerService) {}

  async sendPasswordEmail(to: string, password: string) {
    await this.mailerService.sendMail({
      to,
      subject: '👋 Hoş Geldiniz - Giriş Bilgileriniz',
      template: 'password-email',
      context: {
        password,
      },
    });
  }
}
