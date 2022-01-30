require('dotenv').config()
const { Storage } = require('@google-cloud/storage')

const { BUCKET_NAME, KEY_FILE, PROJECT_ID } = process.env
console.log(BUCKET_NAME, KEY_FILE, PROJECT_ID)

// Creates a client
// const storage = new Storage({ projectId: PROJECT_ID, keyFilename: KEY_FILE })
const storage = new Storage({ keyFilename: KEY_FILE })
const bucketName = `${BUCKET_NAME}-input`
const fileName = 'input.avi'

async function generateV4ReadSignedUrl() {
  // These options will allow temporary read access to the file
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  }

  // Get a v4 signed URL for reading the file
  const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options)

  console.log('Generated GET signed URL:')
  console.log(url)
  console.log('You can use this URL with any user agent, for example:')
  console.log(`curl '${url}'`)
}

generateV4ReadSignedUrl().catch(console.error)
