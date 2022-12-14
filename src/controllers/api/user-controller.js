/**
 * AccountController module.
 *
 * @author Daniel Andersson
 * @version 1.1.0
 */

import createError from 'http-errors'
import userService from '../../libs/user_service/index.js'
import mail_service from '../../libs/mail_service/index.js'

/**
 * Encapsulates a controller.
 */
export class UserController {
  /**
   * Registers a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Next middleware function.
   */
  async register(req, res, next) {
    try {
      const { email, password } = req.body

      const user = await userService.createUser(email, password)

      res.status(201).json({
        id: user.id,
        email: user.email
      })
    } catch (err) {
      let error = err

      if (error.code === 11000) {
        error.status = 409
      } else if (error.name === 'ValidationError') {
        error = createError(400)
      }
      next(error)
    }
  }

  /**
   * Login a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Next middleware function.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const { accessToken, refreshToken } = await userService.authenticateUser(
        email,
        password
      )

      res.status(200).json({
        accessToken,
        refreshToken
      })
    } catch (err) {
      next(createError(401, 'Credentials invalid or not provided.'))
    }
  }

  /**
   * Validates user token and sends reset link.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Next middleware function.
   */
  async resetPassword(req, res, next) {
    const { email, resetUrl } = req.body

    try {
      const { resetToken } = await userService.setResetToken(email)

      const url = new URL(`${resetUrl}/${resetToken}`)

      const message = `
          <body style="background-color: #ffffff; font-size: 16px;">
    <center>
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="height:100%; width:600px;">
          <tr>
            <td align="center" bgcolor="#ffffff" style="padding:30px">
               <p style="text-align:left">Hej!<br><br>
               En f??rfr??gan om att ??terst??lla l??senordet p?? ditt Binvoice-konto har kommit in. Tryck p?? ??terst??llningsl??nken f??r att v??lja ett nytt l??senord.
              </p>
              <p>
                <a target="_blank" style="text-decoration:none; background-color: black; border: black 1px solid; color: #fff; padding:10px 10px; display:block;" href="${url}">
                  <strong>Reset Password</strong></a>
              </p>
              <p style="text-align:left">Denna l??nk kan bara anv??ndas en g??ng och ??r giltig i 15 minuter. Ny f??rfr??gan m??ste g??ras om l??nk f??rbrukas/g??r ut.<br><br>Bortse fr??n detta mail om du inte gjort f??rfr??gan.</p>
              <p style="text-align:left">
              Med v??nlig h??lsning,<br> Binvoice
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </center>
  </body>
      `

      await mail_service.sendEmail({
        receiver: email,
        subject: '??terst??llning l??senord Binvoice',
        body: message
      })

      res.status(200).json({ message: 'Email sent successfully.' })
    } catch (err) {
      next(err)
    }
  }

  /**
   * Sets the new password.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Next middleware function.
   */
  async newPassword(req, res, next) {
    const { password } = req.body
    const token = req.params.resetToken

    try {
      await userService.setNewPassword(token, password)

      res.status(200).json({ message: 'Password set successfully.' })
    } catch (err) {
      next(err)
    }
  }

  /**
   * Refreshes JWTs.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Next middleware function.
   */
  async refreshJWT(req, res, next) {
    const { refreshToken } = req.body

    try {
      const newToken = userService.setNewJWT(refreshToken)

      res.status(200).json({ refreshToken: refreshToken, accessToken: newToken })
    } catch (err) {
      next(err)
    }
  }
}
