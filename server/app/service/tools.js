const Service = require('egg').Service
const nodemailer = require('nodemailer')
const user = require('../model/user')
const path = require('path')
const fse = require('fs-extra')

const userEmail = 'javaliyang@163.com'
const transporter = nodemailer.createTransport({
  service: '163',
  secureConnection: true,
  auth: {
    user: userEmail,
    pass: 'liyang@911202',
  },
})

class ToolsService extends Service {
  async sendMail(email, subject, text, html) {
    const mailOptions = {
      from: userEmail,
      cc: userEmail, // 抄送
      to: email,
      subject,
      text,
      html,
    }

    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.log('email error', error)
      return false

    }
  }

  async mergeFile(filePath, fileHash, size) {
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, fileHash)// 切片文件夹
    let chunks = await fse.readdir(chunkDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map(cp => path.resolve(chunkDir, cp))
    await this.mergeChunks(chunks, filePath, size)
  }

  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) => new Promise(resolve => {
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
        fse.unlinkSync(filePath)
        resolve()
      })
      readStream.pipe(writeStream)
    })
    await Promise.all(
      files.map((file, index) => {
        pipStream(file, fse.createWriteStream(dest, {
          start: index * size,
          end: (index + 1) * size,
        }))
        return
      })
    )
  }
}

module.exports = ToolsService
