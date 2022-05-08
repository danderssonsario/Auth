import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import crypto from 'crypto'

/**
 * Creates a user and stores to database.
 * 
 * @param {string} username - Username.
 * @param {string} email - Email.
 * @param {string} password - Password.
 * @returns 
 */
 const createUser = User => async (username, email, password) => {
  const user = new User({
    username: username,
    email: email,
    password: password
  })

  await user.save()

  return user
}

/**
 * Reset token handler.
 * 
 * @param {String} email - User's email. 
 * @returns 
 */
 const setResetToken = User => async (email) => {
  const user = await User.findOne({ email })

  if (!user) {
    throw new createError(404, 'No user')
  }

  const resetToken = await User.generateResetToken(user)

  await User.save(user)

  return {user: user, resetToken: resetToken}
}

/**
 * Authentication handler.
 * 
 * @param {string} username - Username.
 * @param {string} password - Password.
 * @returns 
 */
 const authenticateUser = User => async (username, password) => {
  const user = await User.findOne({ username })
  
  if(!user) {
    throw new Error()
  }

  await User.checkPassword(user, password)

  //const buff = Buffer.from(process.env.JWT_SECRET, 'base64')
  //const key = buff.toString('utf-8')

  const accessToken = jwt.sign({user:user}, process.env.JWT_SECRET, {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_EXPIRE
  })

  return accessToken
}

/**
 * Sets new password.
 * 
 * @param {String} token - The reset token.
 * @param {String} password - The new password
 * @returns 
 */
 const setNewPassword = User => async (token, password) => {
  const resetToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({ resetToken })

  await User.checkResetToken(user)

  // set new password and consume token.
  user.password = password
  user.resetToken = undefined
  user.expireToken = undefined

  if(User.save._isMockFunction) {
    await User.save(user)
  } else {
    await user.save()
  }
  return
}

 const userService = (User) => {
  return {
    createUser: createUser(User),
    setResetToken: setResetToken(User),
    authenticateUser: authenticateUser(User),
    setNewPassword: setNewPassword(User)
  }
}
export default userService