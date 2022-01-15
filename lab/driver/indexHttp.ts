import axios from 'axios'
import dotenv from 'dotenv'

(async () => {
  dotenv.config()
  const resp = await axios.get(process.env.URL)
  console.log(resp)
})()
