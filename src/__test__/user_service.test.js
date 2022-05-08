import userService from '../libs/user_service/user_service.js'
import { expect, jest } from '@jest/globals'
import Sinon from 'sinon'
import mongoose from 'mongoose'
import crypto from 'crypto'

afterEach(() => jest.clearAllMocks())

const mockUser = {
  _id: new mongoose.Types.ObjectId().toString(),
  email: 'da222xg@student.lnu.se',
  username: 'daniel',
  password: '$2b$10$JI2EVOBFQtsPDdcec5xFoOvWaqLW.OJzFuJsfjmu1OlkolleBK84a',
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0,
  expireToken: 'date:2022-04-14T20:13:49.512Z',
  resetToken: '4a97e53e5735bda2f963572ef81ec85327a0edcff0b739fc9d1297e153afcbbd'
}

describe('creating a user', () => {
  it('should be saved to a database', () => {
    const save = Sinon.spy()
    let username, email, password

    const MockModel = function (data) {
      (username = data.username), (email = data.email), (password = data.password)
      return {
        ...data,
        save
      }
    }
    const user_service = userService(MockModel)

    user_service.createUser('username', 'email@email.com', 'password')

    expect(username).toEqual('username')
    expect(email).toEqual('email@email.com')
    expect(password).toEqual('password')
    expect(save.calledOnce).toBe(true)
  })
})

describe('authenticating a user', () => {
  it('should return an access token', async () => {
    const mockModel = {
      findOne: jest.fn(({ username }) => {
        return mockUser
      }),
      checkPassword: jest.fn(async (user, password) => {
        return await Promise.resolve(true)
      })
    }

    const user_service = userService(mockModel)
    const resetToken = await user_service.authenticateUser(mockUser.username, mockUser.password)

    expect(resetToken).toBeDefined()
    expect(mockModel.findOne).toHaveBeenCalledTimes(1)
    expect(mockModel.findOne).toHaveBeenCalledWith({ username: mockUser.username })
    expect(mockModel.checkPassword).toHaveBeenCalledTimes(1)
    expect(mockModel.checkPassword).toHaveBeenCalledWith(mockUser, mockUser.password)
  })
})

describe('setting a reset token', () => {
  it('should return an object containing a user and reset token.', async () => {
    const mockModel = {
      findOne: jest.fn().mockImplementationOnce(({ email }) => {
        return mockUser
      }),
      generateResetToken: jest.fn().mockImplementationOnce(() => {
        return mockUser.resetToken
      }),
      save: jest.fn().mockImplementation(async () => {
        return await Promise.resolve(true)
      })
    }

    const user_service = userService(mockModel)
    const { user, resetToken } = await user_service.setResetToken(mockUser.email)

    expect(user).toBeDefined()
    expect(user).toEqual(mockUser)
    expect(resetToken).toBeDefined()
    expect(mockModel.findOne).toHaveBeenCalledTimes(1)
    expect(mockModel.findOne).toHaveBeenCalledWith({ email: mockUser.email })
    expect(mockModel.generateResetToken).toHaveBeenCalledTimes(1)
    expect(mockModel.generateResetToken).toHaveBeenCalledWith(user)
    expect(mockModel.save).toHaveBeenCalledTimes(1)
    expect(mockModel.save).toHaveBeenCalledWith(mockUser)
  })
})

describe('setting a new password', () => {
  it('should result in a new password being set', async () => {
    const newPassword = 'newPassword'
    const mockToken = '58026220910dedf8831c2638d76876614d70899c'
    const resetToken = crypto.createHash('sha256').update(mockToken).digest('hex')

    const mockModel = {
      findOne: jest.fn().mockImplementationOnce((resetToken) => {
        return mockUser
      }),
      checkResetToken: jest.fn().mockImplementationOnce(async (user) => {
        return await Promise.resolve(true)
      }),
      save: jest.fn().mockImplementationOnce(() => (mockUser.password = newPassword))
    }

    const user_service = userService(mockModel)
    await user_service.setNewPassword(mockToken, newPassword)

    expect(mockUser.password).toBe(newPassword)
    expect(mockModel.findOne).toHaveBeenCalledTimes(1)
    expect(mockModel.findOne).toHaveBeenCalledWith({ resetToken })
    expect(mockModel.checkResetToken).toHaveBeenCalledTimes(1)
    expect(mockModel.checkResetToken).toHaveBeenCalledWith(mockUser)
    expect(mockModel.save).toHaveBeenCalledTimes(1)
    expect(mockModel.save).toHaveBeenCalledWith(mockUser)
  })
})

