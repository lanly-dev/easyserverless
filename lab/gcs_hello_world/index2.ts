// https://cloud.google.com/storage/docs/samples/storage-upload-without-authentication-create-resumable
// https://cloud.google.com/storage/docs/samples/storage-upload-without-authentication-signed-url

import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'
dotenv.config()

const { BUCKET_NAME, KEY_FILE } = process.env
console.log(BUCKET_NAME, KEY_FILE)

const bNameInput = `${BUCKET_NAME}-input`
const input = 'input.avi'

async function main() {
  try {
    // Doesn't work without key file
    const storage = new Storage()
    const url = await generateV4WriteSignedUrl()
    console.log(url)
    // If validated
    // Error: The uploaded data did not match the data from the server. As a precaution, the file has been deleted.
    // To be sure the content is the same, you should try uploading the file again.
    await storage.bucket(bNameInput).upload(input, { destination: input, uri: url, onUploadProgress, validation: false })
    console.log(`${input} uploaded to ${bNameInput}`)

    // await storage.bucket(bNameOutput).file(output).download({ destination: output })
    // console.log(`gs://${bNameOutput}/${output} downloaded to ${output}`)

  } catch (error) {
    //@ts-ignore
    console.error('Error:', error.message)
  }
}

async function generateV4WriteSignedUrl() {
  // Doesn't work without key file
  const storage = new Storage({ keyFilename: KEY_FILE })
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  }

  //@ts-ignore
  const [url] = await storage.bucket(bNameInput).file(input).getSignedUrl(options)
  return url
}

function onUploadProgress(progressEvent: any) {
  console.log(progressEvent)
}

// Assume file in the same directory
main()
