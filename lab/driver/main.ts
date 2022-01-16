import { Storage } from '@google-cloud/storage'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

//@ts-ignore
const { BUCKET } = process.env
const bInput = `${BUCKET}-input`
const bOutput = `${BUCKET}-output`;
(async () => {
  const input = 'input.wav'
  const name = input.split('.').shift()
  const outFile = `${name}.mp3`
  const storage = new Storage()

  await storage.bucket(bInput).upload(input, { destination: input })
  console.log(`${input} uploaded to gs://${bInput}/${input}`)

  const data = { fileName: input }
  //@ts-ignore
  const resp = await axios.post(process.env.URL, data)
  console.log(resp.data)

  //@ts-ignore
  await storage.bucket(bOutput).file(resp.data).download({ destination: outFile })
  console.log(`gs://${bOutput}/${resp.data} downloaded to ${outFile}`)
})()
