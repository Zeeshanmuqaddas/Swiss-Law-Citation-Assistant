import nodemailer from "nodemailer";
import { pubsub, logTask } from "../pubsub";

const hasMailConfig = !!process.env.SMTP_SERVER && !!process.env.SMTP_PORT && !!process.env.EMAIL_ADDRESS;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 📬 EMAIL WORKER (Simulating Cloud Run Delivery Service)
pubsub.on("email-send", async (event) => {
  const { taskId, email, subject, body } = event;
  
  logTask(taskId, "Delivery", "Preparing to send email via SMTP...");

  try {
    if (!hasMailConfig) {
      console.log(`[SIMULATED EMAIL SENT] To: ${email} | Subject: ${subject}`);
      logTask(taskId, "Delivery", "Email logged successfully (SMTP credentials missing, simulated sent)");
    } else {
      await transporter.sendMail({
        from: process.env.EMAIL_ADDRESS,
        to: email,
        subject: subject,
        text: body,
      });
      logTask(taskId, "Delivery", "Email sent successfully via SMTP");
    }
    logTask(taskId, "Delivery", "Task completed gracefully", "completed");
    
  } catch (err: any) {
    console.error("Send Email error:", err);
    logTask(taskId, "Delivery", `Email Send Error: ${err.message}`, "error");
  }
});
