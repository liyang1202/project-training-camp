<template>
  <div>
    <h1>用户中心</h1>
    <h3>欢迎回来,{{nickname}}</h3>
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange">
    </div>
    <div>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress"></el-progress>
    </div>
    <div>
      <el-button @click="uploadFile">上传</el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="hashProgress"></el-progress>
    </div>
    <div>
      <!-- chunk progress
      progress<0  报错
      progress==100 成功
      别的数字  方块显示 -->
      <div class="cube-container" :style="{width:cubeWidth+'px'}">
        <div class="cube" v-for="chunk in chunks" :key="chunk.name">
          <div :class="{
            'uploading':chunk.progress>0 && chunk.progress<100,
            'success':chunk.progress==100,
            'error':chunk.progress<0
          }" :style="{height: chunk.progress+'%'}">
            <i class="el-icon-loading" style="color:#f56c6c" v-if="chunk.progress>0&&chunk.progress<100"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import sparkMD5 from 'spark-md5'
  //文件切片大小
  const CHUNK_SIZE = 0.2 * 1024 * 1024

  export default {
    data() {
      return {
        nickname: '',
        file: null,
        // uploadProgress: 0,
        hashProgress: 0,
        chunks: []
      }
    },
    computed: {
      cubeWidth() {
        return Math.ceil(Math.sqrt(this.chunks.length)) * 16
      },
      uploadProgress() {
        if (!this.file || this.chunks.length) {
          return 0
        }
        const loaded = this.chunks.map(item => item.chunk.size * item.progress)
          .reduce((acc, cur) => acc + cur, 0)
        return parseInt(((loaded * 100) / this.file.size).toFixed(2))
      }
    },
    async mounted() {
      const ret = await this.$http.get('/user/info')
      if (ret.code === 0) {
        this.nickname = ret.data.nickname
      }
      this.bindEvents()
    },
    methods: {
      handleFileChange(e) {
        const [file] = e.target.files
        if (!file) return
        this.file = file
      },
      createFileChunk(file, size = CHUNK_SIZE) {
        const chunks = []
        let cur = 0
        while (cur < this.file.size) {
          chunks.push({ index: cur, file: this.file.slice(cur, cur + size) })
          cur += size
        }
        return chunks
      },
      async calculateHashWorker() {
        return new Promise(resolve => {
          this.worker = new Worker('/hash.js')

          this.worker.postMessage({ chunks: this.chunks })
          this.worker.onmessage = e => {
            const { progress, hash } = e.data
            this.hashProgress = Number((progress).toFixed(2))

            if (hashProgress) {
              resolve(hash)
            }
          }
        })
      },
      async requestIdleCallback() {
        const chunks = this.chunks
        return new Promise(resolve => {
          const spark = new sparkMD5.ArrayBuffer()
          let count = 0

          const appendToSpark = async file => {
            return new Promise(resolve => {
              const reader = new FileReader()
              reader.readAsArrayBuffer(file)
              reader.onload = e => {
                spark.append(e.target.result)
                resolve()
              }
            })
          }

          const workLoop = async deadline => {
            while (count < chunks.length && deadline.timeRemaining() > 1) {
              //空闲时间，且有任务
              await appendToSpark(chunks[count].file)
              count++
              if (count < chunks.length) {
                this.hashProgress = Number(((100 * count) / chunks.length).toFixed(2))
              } else {
                this.hashProgress = 100
                resolve(spark.end())
              }
            }
            window.requestIdleCallback(workLoop)
          }
          window.requestIdleCallback(workLoop)
        })
      },
      async calculateHashSample() {
        //布隆过滤器  判断一个数据存在与否
        //1各G的文件  抽样后5M以内
        //hash一样，文件不一定一样
        //hash不一样，文件一定不一样
        return new Promise(resolve => {
          const spark = new sparkMD5.ArrayBuffer()
          const reader = new FileReader()
          const file = this.file
          const size = file.size
          const offset = 2 * 1024 * 1024
          //第一个区块 最后一个区块全要
          //中间的  去前中后各两个字节
          let chunks = [file.slice(0, offset)]
          let cur = offset
          while (cur < size) {
            if (cur + offset >= size) {
              //最后一个区块
              chunks.push(file.slice(cur, cur + offset))
            } else {
              const mid = cur + offset / 2
              const end = cur + offset
              chunks.push(file.slice(cur, cur + 2))
              chunks.push(file.slice(mid, mid + 2))
              chunks.push(file.slice(end, end - 2))
            }
            cur += offset
          }
          reader.readAsArrayBuffer(new Blob(chunks))
          reader.onload = e => {
            spark.append(e.target.result)
            this.hashProgress = 100
            resolve(spark.end())
          }
        })
      },
      async uploadFile() {
        if (!this.file) {
          return
        }

        // if (!await this.isImage(this.file)) {
        //   console.log('文件格式错误！')
        //   return
        // }
        // console.log('文件格式正确！')
        // return

        const chunks = this.createFileChunk(this.file)

        //
        // const hash = await this.calculateHashWorker()

        //利用浏览器空闲时间切片
        // const hash = await this.requestIdleCallback()

        //抽样hash  不算全量  布隆过滤器 损失一小部分的精度换取效率
        const hash = await this.calculateHashSample()
        this.hash = hash

        // 后端   文件是否已上传  没有  是否有上传切片
        const { data: { uploaded, uploadedList } } = await this.$http.post('/checkfile', {
          hash: this.hash,
          ext: this.file.name.split('.').pop()
        })

        if (uploaded) {
          //秒传
          return this.$message.success('秒传成功')
        }

        this.chunks = chunks.map((chunk, index) => {
          //文件切片名字  hash+index
          const name = hash + '-' + index
          return {
            hash,
            name,
            index,
            chunk: chunk.file,
            //设置进度条，已经上传的设置为100
            progress: uploadedList.indexOf(name) > -1 ? 100 : 0
            // progress: 0
          }
        })

        await this.uploadChunks(uploadedList)
      },
      async uploadChunks(uploadedList = []) {
        const requests = this.chunks
          .filter(chunk => uploadedList.indexOf(chunk.name) === -1)
          .map((chunk, index) => {
            //转成promise
            const form = new FormData()
            form.append('chunk', chunk.chunk)
            form.append('hash', chunk.hash)
            form.append('name', chunk.name)
            form.append('index', chunk.index)
            return { form, index: chunk.index, error: 0 }
          })
        // .map(({ form, index }) => this.$http.post('/uploadfile', form, {
        //   onUploadProgress: progress => {
        //     //不是整体进度条，而是每个区块的进度条

        //     this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
        //   }
        // }))

        //@todo异步并发量
        //尝试申请tcp连接过多，也会造成卡顿
        // await Promise.all(requests)
        await this.sendRequest(requests)
        await this.mergeRequest()

        // const form = new FormData()
        // form.append('name', 'file')
        // form.append('file', this.file)
        // const ret = await this.$http.post('/uploadfile', form, {
        //   onUploadProgress: progress => {
        //     this.uploadProgress = Number(Number((progress.loaded / progress.total) * 100).toFixed(2))
        //   }
        // })
      },
      //报错之后，进度条变红，开始重试，一个切片重试失败三次，终止任务
      async sendRequest(chunks, limit = 4) {
        //用一个数组，数组的长度是limit
        return new Promise((resolve, reject) => {
          const len = chunks.length
          let count = 0//已完成任务
          let isStop = false

          const start = async () => {
            const task = chunks.shift()
            if (task) {
              const { form, index } = task

              try {
                await this.$http.post('/uploadfile', form, {
                  onUploadProgress: progress => {
                    //不是整体进度条，而是每个区块的进度条
                    this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
                  }
                })
                if (count == len - 1) {
                  resolve()
                } else {
                  count++
                  //启动下一个任务
                  start()
                }
              } catch (error) {
                this.chunks[index].progress = -1
                if (task.error < 3) {
                  task.error++
                  //压入头部尽快上传
                  chunks.unshift(task)
                  start()
                } else {
                  //错误三次  结束
                  isStop = true
                  reject()
                }
              }
            }
          }

          while (limit > 0) {
            //启动limit个任务
            start()
            limit -= 1
          }
        })
      },
      async mergeRequest() {
        this.$http.post("/mergefile", {
          ext: this.file.name.split('.').pop(),
          size: CHUNK_SIZE,
          hash: this.hash
        })
      },
      bindEvents() {
        const drag = this.$refs.drag
        drag.addEventListener('dragover', e => {
          drag.style.borderColor = 'red'
          e.preventDefault()
        })
        drag.addEventListener('dragleave', e => {
          drag.style.borderColor = 'gray'
          e.preventDefault()
        })
        drag.addEventListener('drop', e => {
          const fileList = e.dataTransfer.files
          drag.style.borderColor = 'gray'
          this.file = fileList[0]

          //自动上传
          this.uploadFile()
          e.preventDefault()
        })
      },
      async blobToString(blob) {
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = function () {
            console.log(reader.result);
            const ret = reader.result.split(' ')
              .map(v => v.charCodeAt())
              .map(v => v.toString(16).toUpperCase())
              .map(v => v.padStart(2, '0'))
              .join('')
            resolve(ret)
          }
          reader.readAsBinaryString(blob)
        })
      },
      async isGif(file) {
        //GIF89a  GIF87a
        //前面6位为十六进制为 47 49 46 38 39｜37 61
        //16进制转换
        const ret = await this.blobToString(file.slice(0, 6))
        const isGif = (ret === '47 49 46 38 39 61') || (ret === '47 49 46 38 37 61')
        return isGif
      },
      async isPng(file) {
        //前面8位为十六进制为 89 50 4E 47 0D 0A 1A 0A
        //16进制转换
        const ret = await this.blobToString(file.slice(0, 8))
        const isPng = (ret === '89 50 4E 47 0D 0A 1A 0A')
        return isPng
      },
      async isJpg(file) {
        //前面2位为十六进制为 FF D8
        //后面2位为十六进制为 FF D9
        //16进制转换
        const len = file.size
        const start = await this.blobToString(file.slice(0, 2))
        const tail = await this.blobToString(file.slice(-2, len))
        const isJpg = (start === 'FF D8') && (tail === 'FF D9')
        return isJpg
      },
      async isImage(file) {
        //通过文件流来判定
        return await this.isGif(file) || await this.isPng(file) || await this.isJpg(file)
      }
    }
  }
</script>

<style lang="less">
  #drag {
    height: 100px;
    border: 2px dashed gray;
    text-align: center;
    vertical-align: middle;
    line-height: 100px;
  }

  .cube-container {
    overflow: hidden;

    .cube {
      width: 14px;
      height: 14px;
      line-height: 12px;
      border: 1px solid black;
      float: left;

      .success {
        background: green;
      }

      .uploading {
        background: blue;
      }

      .error {
        background: red;
      }
    }
  }
</style>