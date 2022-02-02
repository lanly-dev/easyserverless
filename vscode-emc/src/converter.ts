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
    const ms = Math.round(t1 - t0)

    const fileSize = pb(fs.statSync(pathToFfmpeg).size)
    const msg = `ffmpeg - ${fileSize} - ${ms} ms downloaded successfully! 🚀🚀`
    this.printToChannel(msg)
    showInformationMessage(msg)
  }

  static convert({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    const p = window.withProgress({
      location: ProgressLocation.Window,
      title: 'Converting'
    }, async (progress) => {
      const { bInput, bOutput, fmtMSS, gcfUrl, printToChannel } = this
      printToChannel(`File input: ${fsPath}`)
      const fileName = path.split('/').pop()
      const name = fileName?.split('.')[0]
      const storage = new Storage()

      if (!this.gcfUrl)  throw Error(`gcfUrl doesn't exist`)
      const { data: uri } = await axios.post(this.gcfUrl, { fileName, needSignedUrl: true } )
      console.log(uri)

      printToChannel(`Uploading to the cloud...`)
      progress.report({ message: `uploading $(cloud-upload)` })
      const t0 = perf.now()
      await storage.bucket(bInput).upload(fsPath, { destination: fileName, uri, validation: false })
      const t1 = perf.now()
      printToChannel(`Time: ${fmtMSS(Math.round(t1 - t0))}`)
      printToChannel(`${fileName} uploaded to cloud`)

      printToChannel('Converting...')
      progress.report({ message: `processing ⚙` })
      const t2 = perf.now()
      const { data: outFileName } = await axios.post(gcfUrl!, { fileName, type })
      const t3 = perf.now()
      printToChannel(`Time: ${fmtMSS(Math.round(t3 - t2))}`)
      printToChannel('Converting finished')

      printToChannel(`Downloading...`)
      progress.report({ message: `downloading $(cloud-download)` })
      const outFsPath = fsPath.replace(fileName!, '')
      // destructure method can't do recursion => this == undefined
      const { outFile: oPath, fileName: oFName } = this.getOutFile(outFsPath, name!, type)
      const t4 = perf.now()
      await storage.bucket(bOutput).file(outFileName).download({ destination: oPath })
      const t5 = perf.now()
      printToChannel(`Time: ${fmtMSS(Math.round(t5 - t4))}`)
      const totalTime = fmtMSS(Math.round(t5 - t0))
      printToChannel(`File downloaded as ${oFName}`)

      return { iFName: fileName, oFName, oPath, totalTime: totalTime }
    })
    p.then(
      ({ iFName, oFName, oPath, totalTime }) => {
        const msg = `${iFName} => ${oFName} completed!`
        this.printToChannel(`${msg}\nTotal time: ${totalTime}`)
        this.printToChannel(`File output: ${oPath}\n`)
        showInformationMessage(`${iFName} => ${oFName} completed!`)
      },
      (error) => {
        this.printToChannel(error.message ?? error)
        showErrorMessage(error.message ?? error)
      }
    )
  }

  static async convertLocal({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    try {
      this.printToChannel(`File input: ${fsPath}`)
      const fileName = path.split('/').pop()
      const name = fileName?.split('.')[0]
      const dir = fsPath.replace(fileName!, '')
      const { outFile: oPath, fileName: oFName } = this.getOutFile(dir, name!, type)

      const t0 = perf.now()
      await this.ffmpegConvert(type, fsPath, oPath)
      const t1 = perf.now()
      const ms = Math.round(t1 - t0)

      const msg = `${fileName} => ${oFName} completed!`
      this.printToChannel(`${msg}\nTotal time: ${this.fmtMSS(ms)}`)
      showInformationMessage(msg)
      this.printToChannel(`File output: ${oPath}\n`)
    } catch (error) {
      //@ts-ignore
      this.printToChannel(error.message ?? error)
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
    if (s < 60) return `${s} sec`
    return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s
  }

  //@ts-ignore
  private static getOutFile(dir: string, name: string, type: 'mp3' | 'mp4', num?: number) {
    const fileName = `${name}${!num ? '' : `-${num}`}.${type}`
    const outFile = resolve(dir, fileName)
    if (fs.existsSync(outFile)) return this.getOutFile(dir, name, type, !num ? 1 : ++num)
    return { outFile, fileName }
  }
}
