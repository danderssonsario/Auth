/**
 * Mongoose configuration module.
 *
 * @author Daniel Andersson
 * @version 1.0.0
 */

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongodb = null
const { connection } = mongoose


/**
 * Establishes a connection to a database.
 *
 * @returns {Promise} - That resolves on a successfull connection.
 */
export const connectDB = async () => {
  
  let connectionString = process.env.DB_CONNECTION_STRING
  if (process.env.NODE_ENV === 'test') {
    mongodb = await MongoMemoryServer.create()
    connectionString = mongodb.getUri()
  } else {
  // Connection events
  connection.on('connected', () => console.log('MongoDB: Connected.'))
  connection.on('error', (err) => console.log(`MongoDB: Error: ${err}`))
  connection.on('disconnected', () => console.log('MongoDB: Disconnected.'))
  }

  // Close connection on Node.js closure
  process.on('SIGINT', () => {
    connection.close(() => {
      console.log('Application terminated, MongoDB disconnected.')
      process.exit(0)
    })
  })

  // Connect DB to server.
  return mongoose.connect(connectionString)
}

// Disconnect after tests.
export const disconnectDB = async () => {
  try {
    await connection.close()
    if (mongodb) {
      await mongodb.stop()
    }
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

// Clear between tests.
export const clearDB = async () => {
  const collections = connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}