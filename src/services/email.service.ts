import { config } from "dotenv";
import { createTransport } from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../constant";
import { MailOptions } from "../interfaces/params";

config();

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendEmail = async (MailOptions: MailOptions) => {
  const mail = {
    from: "arziblack2@gmail.com",
    to: MailOptions.to,
    subject: MailOptions.subject,
    html: MailOptions.html,
  };
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    throw new Error("failed to send email!!");
  }
};