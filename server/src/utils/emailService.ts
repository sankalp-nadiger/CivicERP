import contactEmail from './NodeMailer.js';

interface EmailCredentials {
  email: string;
  name: string;
  password: string;
  role: string;
}

export const sendCredentialsEmail = async (credentials: EmailCredentials): Promise<boolean> => {
  const { email, name, password, role } = credentials;

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: 'Your Incognito Complaint Box Login Credentials',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
          .credentials { background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Incognito Complaint Box</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Your account has been created successfully. You have been assigned the role of <strong>${role}</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login Now</a>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Incognito Complaint Box. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await contactEmail.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export const generatePassword = (prefix: string): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
};
