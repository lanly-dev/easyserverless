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
      this.printToChannel(`File input: ${fsPath}`)
      const fileName = path.split('/').pop()
      const [name, ext] = <string[]>fileName?.split('.')
      const oPath = fsPath.replace(ext ?? '', type)
      const t0 = perf.now()
      await this.ffmpegConvert(type, fsPath, oPath)
      const t1 = perf.now()
      const ms = Math.round(t1 - t0)
      const msg = `${fileName} => ${name}.${type} completed!`
      this.printToChannel(`${msg}\nTotal time: ${this.fmtMSS(ms)}`)
      showInformationMessage(msg)
      this.printToChannel(`File output: ${oPath}`)
    } catch (error) {
      //@ts-ignore
      showErrorMessage(error.message ?? error)
    }
  }

  private static ffmpegConvert(type: string, input: string, output: string) {
    return window.withProgress({
      location: ProgressLocation.Window,
      title: 'Converting'
    }, (progress) => {
      return new Promise<void>((resolve, reject) => {
        let avgFps = 0
        let avgKbps = 0
        let totalFps = 0
        let totalKbps = 0
        let count1 = 0
        let count2 = 0

        ffmpeg(input).format(type).save(output)
          .on('progress', (prog) => {
            const { frames, currentFps: fps, currentKbps: kbps, targetSize: s, timemark } = prog
            if (!isNaN(fps) && fps > 0) {
              totalFps += fps
              avgFps = avgFps === 0 ? avgFps + fps : (avgFps + fps) / 2
              count1++
            }

            if (!isNaN(kbps) && kbps > 0) {
              avgKbps = avgKbps === 0 ? avgKbps + kbps : (avgKbps + kbps) / 2
              totalKbps += isNaN(kbps) ? 0 : kbps
              count2++
            }
            if (!totalFps) totalFps = -1
            if (!totalKbps) totalKbps = -1

            // const msg = `${frames}frame|${fps}fps|${kbps}kbps|${s}size|${timemark}timemark`
            // const message = `${frames}|${fps}|${kbps}|${s}|${timemark}`
            // this.printToChannel(`[ffmpeg] ${msg}`)
            progress.report({ message: timemark })
          })
          .on('error', (err) => {
            this.printToChannel(`[ffmpeg] error: ${err.message}`)
            reject(err)
          })
          .on('end', () => {
            avgFps = this.round((avgFps + totalFps / count1) / 2)
            avgKbps = this.round((avgKbps + totalKbps / count2) / 2)
            this.printToChannel('[ffmpeg] finished')
            this.printToChannel(`Average fps: ${avgFps}, average kbps: ${avgKbps}`)
            resolve()
          })
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
          progress.report({ message: `${dlTotalMb}/${totalMb}` })
        })
        steam.pipe(writer)
        return promisify(stream.finished)(writer)
      })
    })
  }

  private static printToChannel(text: string) {
    channel.append(`${text}\n`)
  }

  private static round(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  // M:SS
  private static fmtMSS(ms: number) {
   let s = Math.round(ms / 1000)
   if (s < 60 ) return `${s} sec`
   return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s
  }
}
