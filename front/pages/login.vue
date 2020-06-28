<template>
  <div class="login-register">
    <el-form class="login-form" label-width="100px" :model="form" :rules="rules" ref="loginForm">
      <div class="title-container">
        <img src="/logo.png" alt="">
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱地址"> </el-input>
      </el-form-item>
      <el-form-item prop="captcha" label="验证码">
        <div class="captcha-container">
          <el-input class="captcha-input" v-model="form.captcha" placeholder="请输入验证码"> </el-input>
          <div class="captcha">
            <img :src="code.captcha" alt="" @click="restCaptcha">
          </div>
        </div>
      </el-form-item>
      <el-form-item prop="meailcode" label="验证码">
        <div class="captcha-container">
          <el-input class="captcha-input" v-model="form.emailcode" placeholder="请输入邮箱验证码"> </el-input>
          <div class="captcha">
            <el-button @click="sendEmailCode" :disable="send.timer>0" type="primary">{{sendText}}</el-button>
          </div>
        </div>
      </el-form-item>
      <el-form-item prop="password" label="密码">
        <el-input type="password" v-model="form.password" placeholder="请输入6～12位密码"> </el-input>
      </el-form-item>
      <el-form-item prop="" label="">
        <el-button type="primary" @click.native="handleLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  import md5 from 'md5'
  export default {
    layout: 'login',
    data() {
      return {
        send: {
          timer: 0
        },
        form: {
          email: "1163028027@qq.com",
          password: "123456",
          captcha: "",
          emailcode: ""
        },
        rules: {
          email: [
            {
              required: true,
              message: "请输入邮箱地址"
            }, {
              type: 'email',
              message: "请输入正确的邮箱地址"
            }
          ],
          captcha: [
            {
              required: true,
              message: "请输入验证码"
            }
          ],
          emailcode: [
            {
              required: true,
              message: "请输入邮箱验证码"
            }
          ],
          password: [
            {
              required: true,
              pattern: /^[\w_-]{6,12}$/g,
              message: "请输入6～12位密码"
            }
          ]
        },
        code: {
          captcha: "/api/captcha?_t" + new Date().getTime()
        }
      }
    },
    computed: {
      sendText() {
        if (this.send.timer <= 0) {
          return '发送'
        }
        return `${this.send.timer}s后发送`
      }
    },
    methods: {
      restCaptcha() {
        this.code.captcha = "/api/captcha?_t" + new Date().getTime()
      },
      handleLogin() {
        this.$refs.loginForm.validate(async valid => {
          if (valid) {
            console.log("校验成功");
            // @todo 发送请求
            let obj = {
              email: this.form.email,
              password: md5(this.form.password),
              captcha: this.form.captcha,
              emailcode: this.form.emailcode
            }
            let ret = await this.$http.post('/user/login', obj)
            // code=0  成功
            if (ret.code === 0) {
              //登录成功  返回token
              this.$message.success('登录成功')
              localStorage.setItem('token', ret.data.token)
              setTimeout(() => {
                this.$router.push("/uc")
              }, 500);
            } else {
              this.$message.error(ret.message)
            }
          } else {
            console.log("校验失败");
          }
        })
      },
      async sendEmailCode() {
        //@todo
        this.send.timer = 10
        this.timer = setInterval(() => {
          this.send.timer -= 1
          if (this.send.timer === 0) {
            clearInterval(this.timer)
          }
        }, 1000)

        await this.$http.get('/sendcode?email=' + this.form.email)
      }
    }
  }
</script>

<style scoped>

</style>