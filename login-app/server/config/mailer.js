
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDir, "../.env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env:", result.error.message);
}

console.log("EMAIL_USER loaded:", Boolean(process.env.EMAIL_USER));
console.log("EMAIL_PASS loaded:", Boolean(process.env.EMAIL_PASS));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log("Gmail SMTP connection successful"))
  .catch((error) => {
    console.error("Gmail SMTP connection failed:", {
      code: error.code,
      message: error.message,
    });
  });

export default transporter;
