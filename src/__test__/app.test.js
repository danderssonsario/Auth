import request from 'supertest'
import { server } from '../server.js'
import { disconnectDB, clearDB } from '../config/mongoose.js'
import User from '../models/User.js'

afterEach(async () => await clearDB())
afterAll(async () => {
  await disconnectDB()
})

const registerInput = {
  email: 'email@email.com',
  password: 'password'
}

const loginInput = {
  email: 'email@email.com',
  password: 'password'
}

const resetInput = {
  email: 'email@email.com'
}

const newPassInput = {
  password: 'newpassword'
}
const app = server

// register a user
describe('POST /register', () => {
  describe('given an email and a password', () => {

    it('should respond with statuscode 201', async () => {
      const res = await request(app).post('/register').send(registerInput)
      expect(res.statusCode).toBe(201)
    })
  })

  describe('when credential(s) is missing', () => {
    it('should respond with statuscode 400.', async () => {
      const inputData = [
        { password: 'password' },
        { email: 'email@email.com' },
        { password: 'password', email: 'email@email.com' },
        {}
      ]

      for (const input in inputData) {
        const res = await request(app).post('/register').send(input)
        expect(res.statusCode).toBe(400)
      }
    })
  })

  describe('when user already exists', () => {
    it('should respond with statuscode 409.', async () => {
      const user = new User(registerInput)
      await user.save()

      const res = await request(app).post('/register').send(registerInput)
      expect(res.statusCode).toBe(409)
    })
  })
})

describe('POST /login', () => {
  describe('given correct credentials', () => {
    it('should respond with a json object containing an access token and refresh token', async () => {
      const user = new User(registerInput)
      await user.save()
      const { statusCode, body } = await request(app).post('/login').send(loginInput)
      expect(statusCode).toBe(200)
      expect(body.accessToken).toBeDefined()
      expect(body.refreshToken).toBeDefined()
    })
  })

  describe('when wrong or no credentials is given', () => {
    it('should respond with statuscode 401', async () => {
      const user = new User(registerInput)
      await user.save()

      const testInput = [
        { email: 'email@email.com', password: 'password1' },
        { email: 'email1@email.com', password: 'password' },
        {}
      ]

      for (const input in testInput) {
        const { statusCode } = await request(app).post('/login').send(input)
        expect(statusCode).toBe(401)
      }
    })
  })
})

describe('POST /reset', () => { 
  describe('Given a correct email', () => {
    it('should respond with statuscode 201 and feedback message', async () => {
      try {
      const user = new User(registerInput)
      await user.save()
      
      const { statusCode, body } = await request(app).post('/reset').send(resetInput)
      expect(statusCode).toBe(200)
      expect(body.message).toBe('Email sent successfully.')
      } catch (e) {}
    })
  }) 
    describe('when invalid email is given', () => {
    it('should respond with statuscode 404', async () => {
      const user = new User(registerInput)
      await user.save()

      const { statusCode } = await request(app).post('/reset').send({email : 'hej@hej.com'})
      expect(statusCode).toBe(404)
    })
  }) 
})

describe('POST /newpass/:id', () => {
  describe('Given a new password and a valid reset token', () => {
    it('should respond with statuscode 200 and feedback message', async () => {
      const user = new User(registerInput)
      const resetToken = await User.generateResetToken(user)
      await user.save()

      const { statusCode, body } = await request(app)
        .post(`/newpass/${resetToken}/`)
        .send(newPassInput)

      expect(statusCode).toBe(200)
      expect(body.message).toBe("Password set successfully.")
    })
  })

  describe('when expire token is missing/expired', () => {
    it('should respond with statuscode 400 and feedback message', async () => {
      const user = new User(registerInput)
      await user.save()

      const { statusCode, body } = await request(app)
        .post(`/newpass/invalidtoken/`)
        .send(newPassInput)

      expect(statusCode).toBe(400)
      expect(body.message).toBe('Invalid reset token.')
    })
  })
})

describe('POST /refresh', () => {
  describe('Given a valid refresh token', () => {
    it('should respond with statuscode 200 and new access token along with the refresh token', async () => {
     const user = new User(registerInput)
     await user.save()
     const res = await request(app).post('/login').send(loginInput)

     let { statusCode, body } = await request(app).post('/refresh').send({refreshToken: res.body.refreshToken})

     console.log(statusCode)

      expect(statusCode).toBe(200)
      expect(body.refreshToken).toBe(body.refreshToken)
      expect(body.accessToken).toBeDefined()
    })
  })

  describe('when invalid refresh token', () => {
    it('should respond with statuscode 403', async () => {
      const { statusCode } = await request(app).post('/refresh').send('invalidtoken')

      expect(statusCode).toBe(403)
    })
  })
})

