import { connectDB, disconnectDB, clearDB } from '../config/mongoose.js'
import User from '../models/User.js'
import crypto from 'crypto'
import { jest } from '@jest/globals'

beforeAll(async () => await connectDB())
afterEach(async () => await clearDB())
afterAll(async () => {
  await disconnectDB()
})

const userData = {
  username: 'username',
  email: 'email@email.com',
  password: 'password'
}

it('has a module', () => {
  expect(User).toBeDefined()
})

describe('create a user', () => {
  describe('given correct fields', () => {
    it('should result in a user created', async () => {
      const user = new User(userData)

      expect(user).toBeDefined()
      expect(user).toBeInstanceOf(User)
    })
  })
})

describe('get a user', () => {
  it('should return a user', async () => {
    const user = new User(userData)
    await user.save()

    const foundUser = await User.findOne({ username: user.username })
    expect(foundUser).toBeDefined()
    expect(foundUser).toBeInstanceOf(User)
  })
})

describe('save a user', () => {
  describe('given correct fields', () => {
    it('should save a user', async () => {
      const user = new User(userData)
      const saved = await user.save()

      expect(saved).toBeDefined()
    })

    it('should hashpassword upon save', async () => {
      const preSavePassword = userData.password
      const user = new User(userData)
      await user.save()

      const actualPassword = user.password

      expect(preSavePassword).not.toEqual(actualPassword)
    })
  })
    describe('given a field is missing', () => {
      it('throw an error', async () => {
        const incompleteUser = {
          username: 'username'
        }
        const user = new User(incompleteUser)
        expect(async () => {
          await user.save()
        }).rejects.toThrow()
      })
    })
})

describe('validate user password', () => {
  describe('when correct password is given', () => {
    it('should only pass', async () => {
      const user = new User(userData)
      await user.save()

      expect(async () => {
        await User.checkPassword(user, userData.password)
      }).not.toThrow()
    })
  })

  describe('when wrong password is given', () => {
    it('should throw error', async () => {
      const user = new User(userData)
      await user.save()
      const wrongPassword = 'wrong'

      expect(async () => {
        await User.checkPassword(user, wrongPassword)
      }).rejects.toThrow()
    })
  })
})


describe('validate reset token', () => {
  describe('given a valid token', () => {
    it('should only pass', async () => {
      const user = new User(userData)
      await user.save()
      User.generateResetToken(user)

      expect(async () => {
        await User.checkResetToken(user)
      }).not.toThrow()
    })
  })
  describe('given an invalid token', () => {
    it('should throw error', async () => {
      const user = new User(userData)
      await user.save()

      expect(async () => {
        await User.checkResetToken(user)
      }).rejects.toThrow()
    })
  })
})

describe('generating a reset token', () => {
  it('should return a token', async () => {
    const user = new User(userData)
    await user.save()

    const resetToken = User.generateResetToken(user)

    expect(resetToken).toBeDefined()
  })
  it('it should set hashed token to user', async () => {
    const user = new User(userData)
    await user.save()

    const resetToken = User.generateResetToken(user)

    const expectedHashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    expect(expectedHashedToken).toEqual(user.resetToken)
    expect(user.expireToken).toBeDefined()
  })
})
