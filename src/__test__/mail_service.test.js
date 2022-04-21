import mailService from '../libs/mail_service/mail_service.js'
import { jest } from '@jest/globals'

const emailData = {
  receiver: 'receiver',
  subject: 'subject',
  body: 'body'
}

const email = {
  from: process.env.EMAIL_USERNAME,
  to: emailData.receiver,
  subject: emailData.subject,
  html: emailData.body
}

describe('sending an email', () => {
  it('should send an email', async () => {
    const mockSend = jest.fn().mockImplementationOnce(async () => { return await Promise.resolve(true) })

    const service = mailService(mockSend)

    await service.sendEmail(emailData)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(expect.any(Object), email)
  })
})
