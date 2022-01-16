// https://github.com/googleapis/nodejs-storage/blob/main/samples/uploadFile.js
// https://github.com/googleapis/nodejs-storage/blob/main/samples/copyFile.js
// https://github.com/googleapis/nodejs-storage/blob/main/samples/downloadFile.js

import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'
dotenv.config()

async function main(bucketName: string, input: string, output: string) {
  console.log(bucketName)
  const storage = new Storage()
  const bNameInput = `${bucketName}-input`
  const bNameOutput = `${bucketName}-output`
  try {
    await storage.bucket(bNameInput).upload(input, { destination: input })
    console.log(`${input} uploaded to ${bNameInput}`)

    // await storage.bucket(bNameInput).file(input).copy(storage.bucket(bNameOutput).file(output))
    // console.log(`gs://${bNameInput}/${input} copied to gs://${bNameOutput}/${bNameOutput}`)

    await storage.bucket(bNameOutput).file(output).download({ destination: output })
    console.log( `gs://${bNameOutput}/${output} downloaded to ${output}`)

  } catch (error) {
    //@ts-ignore
    console.error('Error:', error.message)
  }
}

// Assume file in the same directory
//@ts-ignore
main(process.env.BUCKET_NAME, 'input.wav', 'output.wav')
