'use strict'

const svgCaptcha = require('svg-captcha')
const BaseController = require('./base')
const fse = require('fs-extra')
const path = require('path')

class UtilController extends BaseController {
  async captcha() {
    const { ctx } = this
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      noise: 3,
    })
    ctx.session.captcha = captcha.text
    ctx.response.type = 'image/svg+xml'
    ctx.body = captcha.data
  }

  async sendcode() {
    const { ctx } = this
    const email = ctx.query.email
    const code = Math.random().toString().slice(2, 6)
    ctx.session.emailcode = code

    console.log('邮箱验证码：' + code)


    const subject = '开课吧验证码'
    const text = ''
    const html = `<h2>小开社区</h2><a href="https://kaikeba.com"><span>${code}</span></a>`
    const hasSend = await this.service.tools.sendMail(email, subject, text, html)
    if (hasSend) {
      this.message('发送成功')
    } else {
      this.message('发送失败')
    }
  }

  async uploadfile() {

    if (Math.random() > 0.5) {
      return this.ctx.status = 500
    }

    // public/hash/name
    const { ctx } = this

    const file = ctx.request.files[0]
    const { hash, name } = ctx.request.body

    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    // const filePath = path.resolve(this.config.UPLOAD_DIR,hash)//文件最终存储位置

    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }

    await fse.move(file.filepath, `${chunkPath}/${name}`)
    this.message('切片上传成功')
  }

  async mergefile() {
    const { ext, size, hash } = this.ctx.request.body
    // 合并文件的路径
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)

    await this.ctx.service.tools.mergeFile(filePath, hash, size)
    this.success({
      data: `/public/${hash}.${ext}`,
    })
  }

  async checkfile() {
    const { ctx } = this
    const { ext, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)

    let uploaded = false
    let uploadedList = []

    if (fse.existsSync(filePath)) {
      uploaded = true
    } else {
      uploadedList = await this.getuploadedList(path.resolve(this.config.UPLOAD_DIR, hash))
    }

    this.success({
      uploaded,
      uploadedList,
    })
  }

  async getuploadedList(dirPath) {
    return fse.existsSync(dirPath)
      ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.')
      : []
  }
}

module.exports = UtilController
