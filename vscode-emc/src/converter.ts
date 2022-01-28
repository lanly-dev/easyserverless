import { createWriteStream } from 'fs'
import { performance as perf } from 'perf_hooks'
import { ProgressLocation, Uri, window } from 'vscode'
import { promisify } from 'util'
import { resolve } from 'path'
import { Storage } from '@google-cloud/storage'
import * as fs from 'fs'
import * as os from 'os'
import * as stream from 'stream'
import axios from 'axios'
import dotenv = require('dotenv')
import ffmpeg = require('fluent-ffmpeg')
import pathToFfmpeg = require('ffmpeg-static')
import pb = require('pretty-bytes')

ffmpeg.setFfmpegPath(pathToFfmpeg)
dotenv.config({ path: resolve(__dirname, '.env') })

const { createOutputChannel, showErrorMessage, showInformationMessage } = window
const pkg = require('ffmpeg-static/package.json')
const channel = createOutputChannel('Easy Media Converter')

export default class Converter {
  private static bInput: string
  private static bOutput: string
  private static gcfUrl: string | undefined

  static async init() {
    this.gcfUrl = process.env.URL
    if (!this.gcfUrl) {
      showErrorMessage(`gcfUrl doesn't exist`)
      return
    }
    try {
      const resp = await axios.get(this.gcfUrl)
      const b = resp.data
      this.bInput = `${b}-input`
      this.bOutput = `${b}-output`
    } catch (error) {
      //@ts-ignore
      showErrorMessage(error.message ?? error)
      return
    }
    this.printToChannel('Easy Media Converter activate successfully!')
  }

  static async download() {
    channel.show()
    if (!pathToFfmpeg) {
      showErrorMessage('No binary found for the current architecture')
      return
    }

    if (fs.existsSync(pathToFfmpeg)) {
      showInformationMessage('ffmpeg downloaded already')
      return
    }

    const {
      'ffmpeg-static': { 'binary-release-tag': rTag, 'binary-release-name': rName }
    } = pkg
    const arch = os.arch()
    const platform = os.platform()
    const release = rTag ?? rName
    const baseUrl = `https://github.com/eugeneware/ffmpeg-static/releases/download/${release}`
    const url = `${baseUrl}/${platform}-${arch}`
    const t0 = perf.now()
    await this.downloadStream(url)
    const t1 = perf.now()
    const fileSize = pb(fs.statSync(pathToFfmpeg).size)
    const ms = Math.round(t1 - t0)
    const msg = `ffmpeg - ${fileSize} - ${ms} ms downloaded successfully! 🚀🚀`
    this.printToChannel(msg)
    showInformationMessage(msg)
  }

  static async convert({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    try {
      const { bInput, bOutput, gcfUrl, printToChannel } = this

      printToChannel(path)
      const fileName = path.split('/').pop()
      const storage = new Storage()
      await storage.bucket(bInput).upload(fsPath, { destination: fileName })
      printToChannel(`${fileName} uploaded to cloud`)

      const { data: outFileName } = await axios.post(gcfUrl!, { fileName, type })
      printToChannel('Converting finished')

      const outFsPath = fsPath.replace(fileName!, outFileName)
      await storage.bucket(bOutput).file(outFileName).download({ destination: outFsPath })
      printToChannel(`${outFileName} downloaded`)

    } catch (error) {
      //@ts-ignore
      showErrorMessage(error.message ?? error)
    }
  }

  static async convertLocal({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    try {
      this.printToChannel(fsPath)
      const fileName = path.split('/').pop()
      const ext = fileName?.split('.')[1]
      const oPath = fsPath.replace(ext ?? '', type)
      await this.ffmpegConvert(type, fsPath, oPath)
    } catch (error) {
      //@ts-ignore
      showErrorMessage(error.message ?? error)
    }
  }

  private static ffmpegConvert(type: string, input: string, output: string) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input).format(type).save(output)
        .on('progress', (progress) => {
          this.printToChannel(`[ffmpeg] ${JSON.stringify(progress)}`)
        })
        .on('error', (err) => {
          this.printToChannel(`[ffmpeg] error: ${err.message}`)
          reject(err)
        })
        .on('end', () => {
          this.printToChannel('[ffmpeg] finished')
          resolve()
        })
    })
  }

  private static downloadStream(url: string) {
    const writer = createWriteStream(pathToFfmpeg)
    return window.withProgress({
      location: ProgressLocation.Window,
      title: 'Downloading ffmpeg'
    }, (progress) => {
      return axios.get(url, { responseType: 'stream' }).then((response) => {
        const { data: steam } = response
        const total = response.headers['content-length']
        const totalMb = pb(parseInt(total))
        let dlTotal = 0
        steam.on('data', (chunk: Buffer) => {
          const tmp = pb(dlTotal)
          dlTotal += chunk.length
          const dlTotalMb = pb(dlTotal)
          if (tmp === dlTotalMb) return
          progress.report({ message: `${dlTotalMb}/${totalMb}`})
        })
        steam.pipe(writer)
        return promisify(stream.finished)(writer)
      })
    })
  }

  private static printToChannel(text: string) {
      channel.append(`${text}\n`)
    }
}
