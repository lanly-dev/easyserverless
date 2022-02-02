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
  const { fileName, needSignedUrl, type } = req.body

  if (!fileName) {
    res.send(BUCKET)
    return
  }

  if (needSignedUrl) {
    try {
      res.send(await generateV4WriteSignedUrl(bInput, fileName))
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

async function generateV4WriteSignedUrl(bInput, input) {
  const storage = new Storage()
  console.log('helloworld', bInput, input)
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000
  }

  try {
    //@ts-ignore
    const [url] = await storage.bucket(bInput).file(input).getSignedUrl(options)
    return url

  } catch (error) {
    console.log(error)
  }
}
