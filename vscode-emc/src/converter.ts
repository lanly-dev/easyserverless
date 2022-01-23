import { createWriteStream } from 'fs'
import { promisify } from 'util'
import { Uri, window } from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as stream from 'stream'
import axios from 'axios'
import ffmpeg = require('fluent-ffmpeg')
import pathToFfmpeg = require('ffmpeg-static')

ffmpeg.setFfmpegPath(pathToFfmpeg)
const pkg = require('ffmpeg-static/package.json')
const channel = window.createOutputChannel('Easy Media Converter')

export default class Converter {
  static async download() {
    if (!pathToFfmpeg) {
      window.showErrorMessage('No binary found for the current architecture')
      return
    }

    if (fs.existsSync(pathToFfmpeg)) {
      window.showErrorMessage('ffmpeg downloaded already')
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
    await this.downloadStream(url)
    this.printToChannel('ffmpeg downloaded successfully 🚀')
  }

  static async convert({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    try {
      this.printToChannel(path)
      const name = path.split('/').pop()
    } catch (error) {
      //@ts-ignore
      window.showErrorMessage(error.message ?? error)
    }
  }

  static async convertLocal({ fsPath, path }: Uri, type: 'mp3' | 'mp4') {
    channel.show()
    try {
      this.printToChannel(path)
      const fileName = path.split('/').pop()
      const ext = fileName?.split('.')[1]
      const oPath = fsPath.replace(ext ?? '', type)
      await this.ffmpegConvert(type, fsPath, oPath)
    } catch (error) {
      //@ts-ignore
      window.showErrorMessage(error.message ?? error)
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
    axios.get(url, { responseType: 'stream' }).then((response) => {
      response.data.pipe(writer)
      return promisify(stream.finished)(writer)
    })
  }

  private static printToChannel(text: string) {
    channel.append(`${text}\n`)
  }
}
