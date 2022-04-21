/**
 * User mongoose model.
 *
 * @author Daniel Andersson
 * @version 1.0.0
 */

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'
import crypto from 'crypto'
import createError from 'http-errors'

const { isEmail } = validator

// Schema
const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: [isEmail],
      required: true,
      unique: true,
      trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
      type: String,
      minlength: 1,
      maxlength: 256,
      required: true
    },
    resetToken: String,
    expireToken: Date
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      /**
       * Filter document.
       *
       * @param {object} doc - The mongoose model being converted.
       * @param {object} ret - The object representation of the model.
       */
      transform: function (doc, ret) {
        delete ret._id
        delete ret.__v
      }
    }
  }
)

// String representation of id.
schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Hash pashword upon save.
schema.pre('save', async function () {
  if(this.isModified('password')) this.password = await bcrypt.hash(this.password, 10)
})

/**
 * Validates password.
 *
 * @param {object} user - ...
 * @param {string} password - ...
 * @returns {}
 */
schema.statics.checkPassword = async function (user, password) {

  if (!(await bcrypt.compare(password, user?.password))) {
    throw new Error()
  }

  return
}

/**
 * Saves user.
 * 
 * @param {object} user - ...
 * @returns {Promise} - That resolves upon successful save.
 */
schema.statics.save = async function (user) {
  return await user.save()
}

/**
 * Validates user token.
 * 
 * @param {object} user - ...
 * @returns {}
 */
schema.statics.checkResetToken = async function(user) {
  if (!user?.expireToken || user.expireToken < Date.now()) { throw new createError(400, 'Invalid reset token.') }
  return
}

/**
 * Generates token pair to user.
 * 
 * @param {object} user - ...
 * @returns {String} - Unhashed reset token.
 */
schema.statics.generateResetToken = function (user) {
    const resetToken = crypto.randomBytes(20).toString('hex')

    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    user.expireToken = Date.now() + (60 * 60 * 1000)

    return resetToken
}


 export default mongoose.models.User || mongoose.model('User', schema) 