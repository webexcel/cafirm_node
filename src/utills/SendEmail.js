import nodemailer from 'nodemailer';

const sendEmail = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'epraburajan@gmail.com',
      pass: 'bhairmkaqnnajciw',
    },
  });

  const mailOptions = {
    from: 'epraburajan@gmail.com',
    to: email,
    subject: 'Reset Password Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;