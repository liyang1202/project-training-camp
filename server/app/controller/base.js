// 定制规范
const { Controller } = require('egg')
class BaseController extends Controller {

  success(data) {
    const { ctx } = this
    this.ctx.body = {
      code: 0,
      data,
    }
  }
  message(message) {
    this.ctx.body = {
      code: 0,
      message,
    }
  }
  error(message, code = -1, errors = {}) {
    this.ctx.body = {
      code: 0,
      message,
      errors,
    }
  }
}
module.exports = BaseController
