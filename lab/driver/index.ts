import { CloudFunctionsServiceClient } from '@google-cloud/functions'
import dotenv from 'dotenv'
dotenv.config()

const funcClient = new CloudFunctionsServiceClient()

async function callCallFunction() {
  const name = 'easyServerless'
  const data = { name: 'hello123' }
  const request = {
    name,
    data
  }

  //@ts-ignore
  const response = await funcClient.callFunction(request)
  console.log(response)
}

callCallFunction()
