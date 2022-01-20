import { window } from 'vscode'
import pathToFfmpeg = require('ffmpeg-static')
import ffmpeg = require('fluent-ffmpeg')

export default class Converter {

  static async convert(path: string) {
    this.printToChannel('hello')
  }

  static async convertLocal(path: string) {
    const ffmpeg = require('fluent-ffmpeg')
    ffmpeg.setFfmpegPath(pathToFfmpeg)

    // await ffmpegConvert()
  }

  private ffmpegConvert(format: string, input: string, output: string) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input)
        .on('progress', (progress) => {
          console.log(`[ffmpeg] ${JSON.stringify(progress)}`)
        })
        .on('error', (err) => {
          console.log(`[ffmpeg] error: ${err.message}`)
          reject(err)
        })
        .on('end', () => {
          console.log('[ffmpeg] finished')
          resolve()
        })
        .format(format)
        .save(output)
    })
  }

  private static printToChannel(output: string) {
    const channel = window.createOutputChannel('dictionary')
    channel.append(output)
    channel.show()
  }
}