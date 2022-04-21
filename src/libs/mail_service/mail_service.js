import nodemailer from 'nodemailer'

/**
 * Sends email.
 *
 * @param {Object} data - Email data.
 */
export const sendEmail = (send) => async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      service: process.env.EMAIL_SERVICE,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
    const email = {
      from: process.env.EMAIL_USERNAME,
      to: data.receiver,
      subject: data.subject,
      html: data.body
    }

    send(transporter, email)
  } catch (err) {
    throw new Error(500)
  }
}

export const send = (transporter, email) => {
  return transporter.sendMail(email)
}

const mailService = (send) => {
  return {
    sendEmail: sendEmail(send)
  }
}

export default mailService
