import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Check if SMTP credentials are configured
  if (smtpUser && smtpPass && 
      smtpUser !== 'your-email@gmail.com' && 
      smtpPass !== 'your-app-password') {
    // Use Gmail SMTP
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log('✅ Email transporter configured with Gmail SMTP');
  } else {
    // Use Ethereal Email for testing (doesn't actually send emails)
    console.log('⚠️  SMTP credentials not configured. Using Ethereal Email for testing.');
    console.log('   To send real emails, configure SMTP_USER and SMTP_PASS in .env file');
    
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('📧 Test account created. Emails will be sent to Ethereal Email.');
    console.log('   View emails at: https://ethereal.email');
  }

  return transporter;
};

// Send verification code email
export const sendVerificationCode = async (email, code, language = 'en') => {
  try {
    const emailTransporter = await getTransporter();
    
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const isGmail = smtpUser && smtpPass && 
                    smtpUser !== 'your-email@gmail.com' && 
                    smtpPass !== 'your-app-password';
    
    const fromEmail = isGmail 
      ? (smtpUser || 'ridaa.store.team@gmail.com')
      : 'ridaa.store.team@gmail.com';
    
    const subject = language === 'ar' 
      ? 'كود التحقق من البريد الإلكتروني - RIDAA Store'
      : 'Email Verification Code - RIDAA Store';
    
    const htmlContent = language === 'ar' 
      ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">مرحباً بك في RIDAA Store</h2>
          <p>شكراً لك على التسجيل! يرجى استخدام الكود التالي للتحقق من بريدك الإلكتروني:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #DAA520; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>هذا الكود صالح لمدة 10 دقائق.</p>
          <p>إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© 2025 RIDAA Store. جميع الحقوق محفوظة.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">Welcome to RIDAA Store</h2>
          <p>Thank you for registering! Please use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #DAA520; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© 2025 RIDAA Store. All rights reserved.</p>
        </div>
      `;
    
    const textContent = language === 'ar'
      ? `مرحباً بك في RIDAA Store\n\nكود التحقق: ${code}\n\nهذا الكود صالح لمدة 10 دقائق.`
      : `Welcome to RIDAA Store\n\nVerification Code: ${code}\n\nThis code is valid for 10 minutes.`;
    
    const mailOptions = {
      from: `"RIDAA Store" <${fromEmail}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    if (isGmail) {
      console.log(`✅ Verification code sent to ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
    } else {
      // Ethereal Email - log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Test email sent to ${email}`);
      console.log(`   Preview URL: ${previewUrl}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification code email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, language = 'en') => {
  try {
    const emailTransporter = await getTransporter();
    
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const isGmail = smtpUser && smtpPass && 
                    smtpUser !== 'your-email@gmail.com' && 
                    smtpPass !== 'your-app-password';
    
    const fromEmail = isGmail 
      ? (smtpUser || 'ridaa.store.team@gmail.com')
      : 'ridaa.store.team@gmail.com';
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    
    const subject = language === 'ar' 
      ? 'إعادة تعيين كلمة المرور - RIDAA Store'
      : 'Password Reset - RIDAA Store';
    
    const htmlContent = language === 'ar' 
      ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">إعادة تعيين كلمة المرور</h2>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.</p>
          <p>انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #DAA520; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">إعادة تعيين كلمة المرور</a>
          </div>
          <p>أو انسخ والصق الرابط التالي في متصفحك:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
          <p style="color: #d32f2f; font-weight: bold;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© 2025 RIDAA Store. جميع الحقوق محفوظة.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">Password Reset</h2>
          <p>We received a request to reset the password for your account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #DAA520; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
          <p style="color: #d32f2f; font-weight: bold;">This link is valid for 1 hour only.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© 2025 RIDAA Store. All rights reserved.</p>
        </div>
      `;
    
    const textContent = language === 'ar'
      ? `إعادة تعيين كلمة المرور\n\nانقر على الرابط التالي لإعادة تعيين كلمة المرور:\n${resetUrl}\n\nهذا الرابط صالح لمدة ساعة واحدة فقط.\n\nإذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.`
      : `Password Reset\n\nClick the following link to reset your password:\n${resetUrl}\n\nThis link is valid for 1 hour only.\n\nIf you didn't request a password reset, you can safely ignore this email.`;
    
    const mailOptions = {
      from: `"RIDAA Store" <${fromEmail}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    if (isGmail) {
      console.log(`✅ Password reset email sent to ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
    } else {
      // Ethereal Email - log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Test email sent to ${email}`);
      console.log(`   Preview URL: ${previewUrl}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send generic email
export const sendEmail = async (to, subject, text, html, attachments = []) => {
  try {
    const emailTransporter = await getTransporter();
    
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const isGmail = smtpUser && smtpPass && 
                    smtpUser !== 'your-email@gmail.com' && 
                    smtpPass !== 'your-app-password';
    
    const fromEmail = isGmail 
      ? (smtpUser || 'ridaa.store.team@gmail.com')
      : 'ridaa.store.team@gmail.com';
    
    const mailOptions = {
      from: `"RIDAA Store" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: text || '',
      html: html || text || '',
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    if (isGmail) {
      console.log(`✅ Email sent to ${to}`);
      console.log(`   Message ID: ${info.messageId}`);
    } else {
      // Ethereal Email - log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Test email sent to ${to}`);
      console.log(`   Preview URL: ${previewUrl}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

