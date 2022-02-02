const axios = require('axios')
const { Storage } = require('@google-cloud/storage')
require('dotenv').config()

const { BUCKET_NAME, KEY_FILE } = process.env
const storage = new Storage({ keyFilename: KEY_FILE })

const bInput = `${BUCKET_NAME}-input`
const input =  'input.txt'

async function main() {
  const [location] = await storage.bucket(bInput).file(input).createResumableUpload()
  console.log(location)
  axios.post(location, 'Content of the text file')
  console.log(`${input} uploaded to ${bInput}`)
}

main()
