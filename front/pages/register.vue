<template>
  <div class="login-register">
    <el-form class="login-form" label-width="100px" :model="form" :rules="rules" ref="registerForm">
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
      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称"> </el-input>
      </el-form-item>
      <el-form-item prop="password" label="密码">
        <el-input type="password" v-model="form.password" placeholder="请输入6～12位密码"> </el-input>
      </el-form-item>
      <el-form-item prop="repassword" label="确认密码">
        <el-input type="password" v-model="form.repassword" placeholder="请再次输入密码"> </el-input>
      </el-form-item>
      <el-form-item prop="" label="">
        <el-button type="primary" @click.native="handleRegister">注册</el-button>
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
        form: {
          email: "1163028027@qq.com",
          nickname: "托尼老师爱蹦迪",
          password: "123456",
          repassword: "123456",
          captcha: ""
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
          nickname: [
            {
              required: true,
              message: "请输入昵称"
            }
          ],
          password: [
            {
              required: true,
              pattern: /^[\w_-]{6,12}$/g,
              message: "请输入6～12位密码"
            }
          ],
          repassword: [
            {
              required: true,
              message: "请再次输入密码"
            },
            {
              validator: ((rules, value, callback) => {
                if (value !== this.form.password) {
                  callback(new Error('两次密码不一致'))
                }
                callback()
              })
            }
          ]
        },
        code: {
          captcha: "/api/captcha?_t" + new Date().getTime()
        }
      }
    },
    methods: {
      restCaptcha() {
        this.code.captcha = "/api/captcha?_t" + new Date().getTime()
      },
      handleRegister() {
        this.$refs.registerForm.validate(async valid => {
          if (valid) {
            console.log("校验成功");
            // @todo 发送请求
            let obj = {
              email: this.form.email,
              nickname: this.form.nickname,
              password: md5(this.form.password),
              captcha: this.form.captcha
            }
            let ret = await this.$http.post('/user/register', obj)
            // code=0  成功
            if (ret.code === 0) {
              this.$alert('注册成功', '成功', {
                confirmButtonText: "去登录",
                callback: () => {
                  this.$router.push("/login")
                }
              })
            } else {
              this.message.error(ret.message)
            }
          } else {
            console.log("校验失败");

          }
        })
      }
    }
  }
</script>

<style scoped>

</style>