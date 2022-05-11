/**
 * AccountController module.
 *
 * @author Daniel Andersson
 * @version 1.0.0
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
      const { username, email, password } = req.body

      const user = await userService.createUser(username, email, password)

      res.status(201).json({
        id: user.id,
        username: user.username,
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
      const { username, password } = req.body
      const { user, accessToken } = await userService.authenticateUser(username, password)

      res.status(200).json({
        access_token: accessToken,
        id: user.id,
        username: user.username,
        email: user.email
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
    const { email } = req.body

    try {
      const { user, resetToken } = await userService.setResetToken(email)

      const resetUrl = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/newpass/${resetToken}`
      )

      const message = `
          <body style="background-color: #ffffff; font-size: 16px;">
    <center>
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="height:100%; width:600px;">
          <tr>
            <td align="center" bgcolor="#ffffff" style="padding:30px">
               <p style="text-align:left">Hej ${user.username},<br><br>
               En förfrågan om att återställa lösenordet på ditt konto har kommit in. Tryck på återställningslänken för att välja ett nytt lösenord.
              </p>
              <p>
                <a target="_blank" style="text-decoration:none; background-color: black; border: black 1px solid; color: #fff; padding:10px 10px; display:block;" href="${resetUrl}">
                  <strong>Reset Password</strong></a>
              </p>
              <p style="text-align:left">Denna länk kan bara användas en gång och är giltig i 15 minuter. Ny förfrågan måste göras om länk förbrukas/går ut.<br><br>Bortse från detta mail om du inte gjort förfrågan.</p>
              <p style="text-align:left">
              Med vänlig hälsning,<br> Speedbill
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
        subject: 'Återställning lösenord Speedbill',
        body: message
      })

      res.status(200).json({ message: 'Email sent successfully.'})
    } catch (err) {
      console.log(err)
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

      res.status(200).json({ message: 'Password set successfully.'})
    } catch (err) {
      next(err)
    }
  }
}
