import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: any;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      secure: false, // upgrade later with STARTTLS / TLS
      auth: {
        user: this.config.get('SMTP_USERNAME'),
        pass: this.config.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendActivationMail(to, link) {

    await this.transporter.sendMail({
      from: this.config.get('SMTP_USERNAME'),
      to,
      subject: `Активация аккаунта на сайте ${this.config.get('SITE_URL')}`,
      text: '',
      html: `
        <div>
          <h1>Привет!</h1>
          <p>Для активации вашего аккаунта перейдите по ссылке ниже.</p>
          <a href="${link}" target="_blank">${link}</a>
        </div>
      `,
    });
  }
}
