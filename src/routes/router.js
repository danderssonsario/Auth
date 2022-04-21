/**
 * Routes of this application.
 *
 * @author Daniel Andersson
 * @version 1.0.0
 */

import express from 'express'
import createError from 'http-errors'
import { router as userRouter } from './user-router.js'

export const router = express.Router()

router.use('/', userRouter)

router.get('/', (req, res, next) => {
    res.json({message: 'This is the root of the API.'})
})

// Any other route
router.use('*', (req, res, next) => next(createError(404)))
