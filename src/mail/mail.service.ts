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
      secure: false,
      auth: {
        user: this.config.get('SMTP_USERNAME'),
        pass: this.config.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendActivationMail(to, firstName, link) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_USERNAME'),
      to,
      subject: `Активация аккаунта на сайте ${this.config.get('CLIENT_URL')}`,
      text: '',
      html: `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 2rem; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <tbody>
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody>
                  <tr>
                    <td align="center" style="text-align: center; margin-bottom: 2rem;">
                      <h1 style="font-size: 1.5rem; margin: 0; color: #404040;">${firstName}, добро пожаловать на ${this.config.get('CLIENT_URL')}!</h1>
                      <p style="font-size: 1.2rem; margin: 0.5rem 0; color: #808080;">Пожалуйста, активируйте учетную запись.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                          <tr>
                            <td align="center">
                              <a href="${link}" target="_blank" style="display: inline-block; padding: 0.6rem 2rem; font-size: 1.2rem; font-weight: bold; color: #fff; background-color: #372cec; border-radius: 5px; text-decoration: none; transition: background-color 0.2s;" class="button">Активация учетной записи</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      `,
    });
  }
}
