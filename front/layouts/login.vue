<template>
  <div class="login-container">
    <nuxt></nuxt>
  </div>
</template>

<script>
  export default {

  }
</script>

<style lang="less">
  .login-container {
    width: 100%;
    min-height: 100%;

    .login-form {
      width: 520px;
      padding: 160px 0;
      margin: 0 auto;
      overflow: hidden;
    }

    .title-container {
      text-align: center;
      margin: auto;

      img {
        width: 200px;
        margin-bottom: 50px
      }
    }

    .captcha-container {
      display: flex;

      .captcha {
        text-align: right;
        width: 120px;
        line-height: 0;

        .el-button {
          width: 90px;
          padding: 0;
          line-height: 40px;
        }

        img {
          cursor: pointer;
          line-height: 0;
        }
      }

      .captcha-input {
        flex: 1;
      }
    }
  }
</style>