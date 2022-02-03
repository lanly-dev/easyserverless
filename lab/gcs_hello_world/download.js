const { Storage } = require('@google-cloud/storage')
const axios = require('axios')
const mimeTypes = require('mime-types')
const fs = require('fs')
require('dotenv').config()

const { BUCKET_NAME, KEY_FILE } = process.env
const storage = new Storage({ keyFilename: KEY_FILE })

const bOutput = `${BUCKET_NAME}-output`
const output = 'input-test.avi'

async function main() {
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  }
  const [url] = await storage.bucket(bOutput).file(output).getSignedUrl(options)
  // console.log(url)

  const contentType = mimeTypes.lookup(output)
  const axiosOpts = {
    responseType: 'arraybuffer',
    headers: {
      'Content-Type': contentType
    }
  }

  axios.get(url, axiosOpts)
    .then((resp) => {
      fs.writeFile(output, resp.data, (err) => {
        if (err) throw err.message
        console.log(`${output} downloaded to ${output}`)
      })
    })
    .catch((error) => {
      if (error.response) {
        console.log(error.responderEnd)
      }
    })
}

main()
