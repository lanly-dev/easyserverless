require('dotenv').config()
const { performance: perf } = require('perf_hooks')
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
  const { fileName, needLoc, needUrl, type } = req.body

  if (needLoc) {
    try {
      res.send(await getLocation(bInput, fileName))
    } catch (error) {
      console.error(error)
      res.status(500).send(error.message ?? error)
    }
    return
  }

  if (needUrl) {
    try {
      res.send(await getReadSignedUrl(bOutput, fileName))
    } catch (error) {
      console.error(error)
      res.status(500).send(error.message ?? error)
    }
    return
  }

  const name = fileName.split('.').shift()
  const targetFilePath = resolve(tmpdir(), fileName)
  const outFile = `${name}.${type}`
  const outFilePath = resolve(tmpdir(), outFile)

  console.log(pathToFfmpeg)
  console.log(targetFilePath)
  console.log(outFilePath)

  try {
    const storage = new Storage()
    await storage.bucket(bInput).file(fileName).download({ destination: targetFilePath })
    console.log(`gs://${bInput}/${fileName} downloaded to ${targetFilePath}`)

    ffmpeg.setFfmpegPath(pathToFfmpeg)
    const t0 = perf.now()
    const stats = await convert(type, targetFilePath, outFilePath)
    const t1 = perf.now()

    await storage.bucket(bOutput).upload(outFilePath, { destination: outFile })
    console.log(`${outFilePath} uploaded to gs://${bOutput}/${outFile}`)
    res.send({ outFile, stats, totalTime: Math.round(t1 - t0) })
  } catch (error) {
    console.error(error.message ?? error)
    res.status(500).send(error.message ?? error)
  }
}

function convert(format, input, output) {
  return new Promise((resolve, reject) => {
    let avgFps = 0
    let avgKbps = 0
    let totalFps = 0
    let totalKbps = 0
    let count1 = 0
    let count2 = 0
    ffmpeg(input).format(format).save(output)
      .on('progress', (prog) => {
        const { currentFps: fps, currentKbps: kbps } = prog
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
      })
      .on('error', (err) => {
        console.log(`[ffmpeg] error: ${err.message}`)
        reject(err)
      })
      .on('end', () => {
        avgFps = round((avgFps + totalFps / count1) / 2)
        avgKbps = round((avgKbps + totalKbps / count2) / 2)
        console.log(`[ffmpeg] finished - ${avgFps}fpg | ${avgKbps} kbps`)
        resolve({ avgFps, avgKbps })
      })
  })
}

async function getLocation(bInput, input) {
  const storage = new Storage()
  const [location] = await storage.bucket(bInput).file(input).createResumableUpload()
  return location
}

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

async function getReadSignedUrl(bucketName, fileName) {
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000
  }
  const storage = new Storage()
  const [url] = await storage.bucket(bInput).file(fileName).getSignedUrl(options)
  return url
}
