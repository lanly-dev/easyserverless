import { resolve } from 'path'
import { Uri, window } from 'vscode'
import * as os from 'os'
import axios from 'axios'
import ffmpeg = require('fluent-ffmpeg')
import pathToFfmpeg = require('ffmpeg-static')
import { createWriteStream } from 'fs'
ffmpeg.setFfmpegPath(pathToFfmpeg)
const pkg = require('ffmpeg-static/package.json')
import * as stream from 'stream'
import { promisify } from 'util'

export default class Converter {
  static async download() {
    console.log('hello')
    const {
      'ffmpeg-static': { 'binary-release-tag': rTag, 'binary-release-name': rName }
    } = pkg
    const arch = os.arch()
    const platform = os.platform()
    const baseUrl = `https://github.com/eugeneware/ffmpeg-static/releases/download/${rTag ?? rName}`
    const url = `${baseUrl}/${platform}-${arch}`
    await this.downloadStream(url)
    console.log('Hello')
  }

  static async convert({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    try {
      this.printToChannel(path)
      const name = path.split('/').pop()
    } catch (error) {
      //@ts-ignore
      window.showErrorMessage(error.message ?? error)
    }
  }

  static async convertLocal({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    try {
      this.printToChannel(path)
      const fileName = path.split('/').pop()
      //@ts-ignore
      const [name, ext] = fileName?.split('.')
      const oFileName = `${name}.${type}`
      const oPath = fsPath.replace(ext, type)
      console.log(fsPath, path)
      console.log(oPath)
      await this.ffmpegConvert(type, fsPath, oPath)
    } catch (error) {
      //@ts-ignore
      window.showErrorMessage(error.message ?? error)
    }
  }

  private static ffmpegConvert(type: string, input: string, output: string) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input)
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
        .format(type)
        .save(output)
    })
  }

  private static downloadStream(url: string) {
    const { onDownloadProgress } = this
    console.log(__dirname)
    const writer = createWriteStream(resolve(__dirname, 'ffmpeg'))
    axios.get(url, { responseType: 'stream', onDownloadProgress }).then((response) => {
      console.log(response)
      response.data.pipe(writer)
      return promisify(stream.finished)(writer)
    })
  }

  private static onDownloadProgress(event: any) {
    console.log(event)
  }

  private static printToChannel(output: string) {
    const channel = window.createOutputChannel('Easy Media Converter')
    channel.append(output)
    channel.show()
  }
}
