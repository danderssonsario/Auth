import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes/router.js'
import cors from 'cors'

export async function initServer() {
  try {
  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(morgan('dev'))
  app.use(express.json())

  app.use('/', router)

  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (err.status === 500) {
      err.message = 'An unexpected condition was encountered.'
    }

    if (err.status === 409) {
      return res.status(err.status).end()
    }

    return res.status(err.status).json({
      status_code: err.status,
      message: err.message
    })

    /* return res.status(err.status).json({
      status: err.status,
      message: err.message,
      cause: err.cause
        ? {
            status: err.cause.status,
            message: err.cause.message,
            stack: err.cause.stack
          }
        : null,
      stack: err.stack
    }) */
  })
  return app
  } catch(e) {
    console.error(e)
    process.exitCode = 1
  }
}
