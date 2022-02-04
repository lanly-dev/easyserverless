import { Storage } from '@google-cloud/storage'
import axios from 'axios'
import dotenv from 'dotenv'
import FormData from 'form-data'
import fs from 'fs'
import mime from 'mime-types'
dotenv.config()

const { BUCKET_NAME, KEY_FILE } = process.env
console.log(BUCKET_NAME, KEY_FILE)

const bNameInput = `${BUCKET_NAME}-input`
const input = 'input.avi'

async function main() {
  try {
    const storage = new Storage({ keyFilename: KEY_FILE })
    const [location] = await storage.bucket(bNameInput).file(input).createResumableUpload()
    const mType = mime.lookup(input)

    if (!mType) throw 'mime type error'
    console.log(location)
    console.log(mType)

    // Uploading using formData lost all media properties
    // results conversion failure
    const formData = new FormData()
    formData.append('file', fs.createReadStream(input), { filename: input, contentType: mType })
    const headers = formData.getHeaders()
    const resp = await axios.post(location, formData, {
      'maxBodyLength': Infinity,
      headers
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
