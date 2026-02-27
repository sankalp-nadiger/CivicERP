import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let contactEmail: nodemailer.Transporter | null = null;

// Only create transporter if email credentials are configured
if (process.env.USER_EMAIL && process.env.USER_PASS) {
    contactEmail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASS
        }
    });

    contactEmail.verify((error) => {
        if (error) {
            console.log('❌ Email service error:', error.message);
        } else {
            console.log("✅ Email service ready");
        }
    });
} else {
    console.log('⚠️  Email credentials not configured; email functionality disabled');
}

export default contactEmail;