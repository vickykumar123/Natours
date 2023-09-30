const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlTotext = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = 'Cool Man <user@cool.com>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid
      return 1;
    }
    return nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      //Need to activate "less secure app" option on gmail
    });
  }

  async send(template, subject) {
    // send the actual mail
    //1. Render the email template using pug
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    //2. Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlTotext.fromString(html),
    };
    //3.create a transport and send the mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelCome() {
    await this.send('welcome', 'Welcome to Natours family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset link (valid for only 10min)',
    );
  }
};

// const sendEmail = async (options) => {
//   //1. create the transporter
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     //Need to activate "less secure app" option on gmail
//   });

//   //2. Define the email options
//   const mailOptions = {
//     from: 'Cool Man <user@cool.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };

//   //3. send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
