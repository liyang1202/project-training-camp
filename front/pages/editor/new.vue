<template>
  <div>
    <div class="write-btn">
      <!-- markdown编辑器的基本操作 -->
      <el-button @click="submit" type="primary">提交</el-button>
    </div>
    <el-row>
      <el-col :span="12">
        <textarea ref="editor" class="md-editor" :value="content" @input="update"></textarea>
      </el-col>
      <el-col :span="12">
        <div class="markdown-body" v-html="compiledContent"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import marked from 'marked'
  import highlight from 'highlight.js'
  import javascript from 'highlight.js/lib/languages/javascript'
  import 'highlight.js/styles/monokai-sublime.css'
  export default {
    data() {
      return {
        content: `# 开课吧
* 上课
* 吃饭
* 写代码
\`\`\` javascript
  let a = 1
  console.log(a)
\`\`\`
        `
      }
    },
    computed: {
      compiledContent() {
        return marked(this.content)
      }
    },
    mounted() {
      this.timer = null
      this.bindEvents()

      marked.setOptions({
        renderer: new marked.Renderer(),
        highlight(code) {
          return highlight.highlightAuto(code).value
        }
      })
    },
    methods: {
      async submit() {
        //markdown 和解析后都需要提交
        let ret = await this.$http.post('/article/create', {
          content: this.content,//默认不显示
          compiledContent: this.compiledContent
        })
      },
      update(e) {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.content = e.target.value
        }, 350)
      },
      bindEvents() {
        this.$refs.editor.addEventListener('paste', async e => {
          const files = e.clipboardData.files
          console.log(files)
          //@todo上传  返回连接地址  加入content中
        })
        this.$refs.editor.addEventListener('drop', async e => {
          const files = e.dataTransfer.files
          //@todo上传  返回连接地址  加入content中
          e.preventDefault()
        })

      }
    }
  }
</script>

<style scoped lang="less">
  .md-editor {
    width: 100%;
    height: 100vh;
    outline: none;
  }

  .write-btn {
    position: relative;
    z-index: 100;
    right: 30px;
    top: 10px;
  }
</style>