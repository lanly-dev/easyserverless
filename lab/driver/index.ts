import { CloudFunctionsServiceClient } from '@google-cloud/functions'
import dotenv from 'dotenv'
dotenv.config()
const { PROJECT_ID } = process.env
console.log(PROJECT_ID)
const client = new CloudFunctionsServiceClient({ projectId: PROJECT_ID })

async function listFunctions() {
  const [functions] = await client.listFunctions({
    parent: `projects/${PROJECT_ID}/locations/-`,
  })
  console.info(functions)
}

async function callCallFunction() {
  const name = 'helloWorld'
  const data = JSON.stringify({ name: 'hello123' })
  const request = { name, data }
  try {
    //@ts-ignore
    const response = await client.callFunction(request)
    console.log(response)
  } catch (error) {
    console.error(error)
    //@ts-ignore
    console.error(JSON.stringify(error.statusDetails, null, 2))
  }
}

listFunctions()
callCallFunction() // doesn't works - CONSUMER_INVALID
