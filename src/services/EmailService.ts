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
    const mail = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "Gmail",

      auth: {
        type: "OAuth2",
        user: "abdulgopur2306@gmail.com",
        clientId: "263533951288-n1ou28hraatts67jgr1cqtq332kuvv5q.apps.googleusercontent.com",
        clientSecret: "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",
        refreshToken: "1//04XOED4l6rTb-CgYIARAAGAQSNwF-L9IrViGEt_eTizQLDlwjnAMW6ZhIxARdK-itin7aobQCIZLM3LxIc_Q0nxvU_4iNS9K7OQg",
        accessToken:
          "ya29.a0ARrdaM_g6HDP_JNDKlni14lX-NA9efzRVOUyd-JmHrdxCvRi9VoKIoA4JFxPO3hiduOB2tACmGIjR6TJRczR4xT2uWx6CkkBJRsNZjgOR5Gbyzq1rcBQX3z3BTV4VWmpyGIW9n6i84Sz3ThY-UeCRUm5NIcy",
      },
    });
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
