require('dotenv').config()
const { resolve } = require('path')
const { Storage } = require('@google-cloud/storage')
const { tmpdir } = require('os')
const ffmpeg = require('fluent-ffmpeg')
const pathToFfmpeg = require('ffmpeg-static')

const { BUCKET } = process.env
const bInput = `${BUCKET}-input`
const bOutput = `${BUCKET}-output`

exports.easyServerless = async (req, res) => {
  console.log('Start...')
  const { fileName, needLoc, type } = req.body

  if (!fileName) {
    res.send(BUCKET)
    return
  }

  if (needLoc) {
    try {
      res.send(await getLocation(bInput, fileName))
    } catch (error) {
      console.log(error)
    }
    return
  }

  const name = fileName.split('.').shift()
  const targetFilePath = resolve(tmpdir(), fileName)
  const outFile = `${name}.${type}`
  const outFilePath = resolve(tmpdir(), outFile)
  const storage = new Storage()

  console.log(pathToFfmpeg)
  console.log(targetFilePath)
  console.log(outFilePath)

  try {
    await storage.bucket(bInput).file(fileName).download({ destination: targetFilePath })
    console.log(`gs://${bInput}/${fileName} downloaded to ${targetFilePath}`)

    ffmpeg.setFfmpegPath(pathToFfmpeg)
    await convert(type, targetFilePath, outFilePath)

    await storage.bucket(bOutput).upload(outFilePath, { destination: outFile })
    console.log(`${outFilePath} uploaded to gs://${bOutput}/${outFile}`)
  } catch (error) {
    console.error(error.message ?? error)
  }
  res.send(outFile)
}

function convert(format, input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input).format(format).save(output)
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
  })
}

async function getLocation(bInput, input) {
  const storage = new Storage()

  try {
    //@ts-ignore
    const [location] = await storage.bucket(bInput).file(input).createResumableUpload()
    return location

  } catch (error) {
    console.log(error)
  }
}
