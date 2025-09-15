import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


export const sendVerificationEmail = async (to: string, code: string) => {
    const mailOptions = {
        from: 'thepolyhistorapp@gmail.com',
        to: to,
        subject: 'Verify Your Email Address',
        html: `
      <h1>Email Verification</h1>
      <p>Thank you for registering. Please use the following code to verify your email address:</p>
      <h2>${code}</h2>
    `,
    };

    await transporter.sendMail(mailOptions);
};