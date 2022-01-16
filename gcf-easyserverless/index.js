require('dotenv').config()
const { Storage } = require('@google-cloud/storage')
const pathToFfmpeg = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')

const { BUCKET } = process.env
const bInput = `${BUCKET}-input`
const bOutput = `${BUCKET}-output`

exports.easyServerless = async (req, res) => {
  console.log('Start...')
  const { fileName } = req.body

  console.log(fileName)
  console.log(pathToFfmpeg)

  try {
    const output = 'output.mp3'
    const storage = new Storage()

    await storage.bucket(bInput).file(fileName).download({ destination: fileName })
    console.log(`gs://${bInput}/${fileName} downloaded`)

    ffmpeg.setFfmpegPath(pathToFfmpeg)

    const cmd = ffmpeg(fileName).format('mp3')
    cmd.save(output)

    // const command = ffmpeg('input.avi').format('mp4')
    // command.save('output.mp4')

    await storage.bucket(bOutput).upload(output, { destination: output })
    console.log(`${output} uploaded to gs://${bOutput}/${output}`)
  } catch (error) {
    console.error(error.message ?? error)
  }

  res.send(output)
}
