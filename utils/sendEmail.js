import FormData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";
dotenv.config();

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY, 
});

const DOMAIN = process.env.MAILGUN_DOMAIN; 
const FROM = process.env.MAILGUN_FROM_EMAIL;

export async function sendEmail(to, subject, text, html) {
  try {
    const data = await mg.messages.create(DOMAIN, {
      from: FROM,
      to: [to],
      subject,
      html
    });
    console.log("Mailgun response:", data);
    return data;
  } catch (err) {
    console.error("Mailgun send error:", err);
    throw err;
  }
}
