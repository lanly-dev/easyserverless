// https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js

import { Storage } from '@google-cloud/storage'
import axios from 'axios'
import dotenv from 'dotenv'
import FormData from 'form-data'
import fs from 'fs'
dotenv.config()
//@ts-ignore
import fetch = require('node-fetch')

const { BUCKET_NAME, KEY_FILE } = process.env
console.log(BUCKET_NAME, KEY_FILE)

const bNameInput = `${BUCKET_NAME}-input`
const bNameOutput = `${BUCKET_NAME}-output`

const input = 'input.avi'
const output = 'input.avi'

async function main() {
  try {
    const storage = new Storage({ keyFilename: KEY_FILE })
    const [location] = await storage.bucket(bNameInput).file(input).createResumableUpload()
    // console.log(location)

    const formData = new FormData()
    formData.append('file', fs.createReadStream(input), input)
    const resp = await axios.post(location, formData, {
      'maxBodyLength': Infinity
    })
    console.log(`${input} uploaded to ${bNameInput}`)
    console.log(resp)

  } catch (error) {
    //@ts-ignore
    console.error('Error:', error.message)
  }
}

// Assume file in the same directory
main()
