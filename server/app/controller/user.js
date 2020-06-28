const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const HashSalt = 'project-training-camp'

const createRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  password: { type: 'string' },
  captcha: { type: 'string' },
}

class UserController extends BaseController {
  async login() {
    // this.success('token')
    const { ctx } = this
    const { email, password, captcha, emailcode } = ctx.request.body

    // 校验验证码
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误', -1)
    }

    // 校验邮箱验证码
    if (emailcode !== ctx.session.emailcode) {
      return this.error('邮箱验证码错误', -1)
    }

    const user = await ctx.model.User.findOne({
      email,
      password: md5(password + HashSalt),
    })
    if (!user) {
      return this.error('用户名或密码错误', -1)
    }
    // 用户信息加密称token  返回
    const token = jwt.sign({
      _id: user._id,
      email,
    }, this.app.config.jwt.secret, {
      expiresIn: '1h',
    })
    this.success({ token, email, nickname: user.nickname })
  }

  async register() {
    const { ctx } = this
    try {
      // 校验传递的参数
      ctx.validate(createRule)
    } catch (e) {
      return this.error('参数校验失败', -1, e.errors)
    }

    const { email, password, nickname, captcha } = ctx.request.body

    // 校验验证码
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误', -1, e.errors)
    }

    // 判断邮箱是否重复
    if (await this.checkEmail(email)) {
      this.error('邮箱已存在')
    } else {
      const result = await ctx.model.User.create({
        email,
        nickname,
        password: md5(password + HashSalt),
      })

      if (result._id) {
        this.message('注册成功')
      }
    }

    // this.success({ name: 'kkb' })
  }

  async checkEmail(email) {
    const user = await this.ctx.model.User.findOne({ email })
    return user
  }

  async verify() {
    // 校验用户名是否存在
  }

  async info() {
    const { ctx } = this
    // 需要从token中读取email
    const { email } = ctx.state
    const user = await this.checkEmail(email)
    this.success(user)
  }
}
module.exports = UserController
