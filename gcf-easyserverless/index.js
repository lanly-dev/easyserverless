require('dotenv').config()
const { resolve, format } = require('path')
const { Storage } = require('@google-cloud/storage')
const { tmpdir } = require('os')
const pathToFfmpeg = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')

const { BUCKET } = process.env
const bInput = `${BUCKET}-input`
const bOutput = `${BUCKET}-output`

exports.easyServerless = async (req, res) => {
  console.log('Start...')
  const { fileName } = req.body
  const name = fileName.split('.').shift()
  const targetFilePath = resolve(tmpdir(), fileName)
  const outFile = `${name}.mp3`
  const outFilePath = resolve(tmpdir(), outFile)

  console.log(targetFilePath)
  console.log(pathToFfmpeg)

  try {
    const storage = new Storage()

    await storage.bucket(bInput).file(fileName).download({ destination: targetFilePath })
    console.log(`gs://${bInput}/${fileName} downloaded to ${targetFilePath}`)

    ffmpeg.setFfmpegPath(pathToFfmpeg)
    const format = 'mp3'
    await convert(format, targetFilePath, outFilePath)

    // const command = ffmpeg('input.avi').format('mp4')
    // command.save('output.mp4')

    await storage.bucket(bOutput).upload(outFilePath, { destination: outFile })
    console.log(`${outFilePath} uploaded to gs://${bOutput}/${outFile}`)
  } catch (error) {
    console.error(error.message ?? error)
  }

  res.send(outFile)
}

function convert(format, input, output) {
  return new Promise((resolve, reject) => {
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
