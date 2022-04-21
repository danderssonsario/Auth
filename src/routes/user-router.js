/**
 * Account routes.
 *
 * @author Daniel Andersson
 * @version 1.0.0
 */

import express from 'express'
import { UserController } from '../controllers/api/user-controller.js'

export const router = express.Router()

const controller = new UserController()

router.post('/register', (req, res, next) => controller.register(req, res, next))

router.post('/login', (req, res, next) => controller.login(req, res, next))

router.post('/reset', (req, res , next) => controller.resetPassword(req, res, next))

router.post('/newpass/:resetToken', (req, res, next) => controller.newPassword(req, res, next))
