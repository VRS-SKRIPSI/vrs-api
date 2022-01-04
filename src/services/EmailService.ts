import nodemailer from "nodemailer";

interface iBodyEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface iEmailService {
  sender(payload: iBodyEmail): Promise<string>;
}

class EmailService implements iEmailService {
  /**
   * sender
   */
  public async sender(payload: iBodyEmail): Promise<string> {
    const mail = nodemailer.createTransport({ service: "Gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });
    const info = await mail.sendMail({
      from: '"CALLING LANGUAGE TRANSLATOR"',
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return `${info.messageId}`;
  }
}

export default new EmailService();
