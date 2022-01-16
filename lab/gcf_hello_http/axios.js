require('dotenv').config()
console.log(process.env.URL)
const axios = require('axios')
;(async () => {
  const data = { name: 'gcloud' }
  const resp = await axios.post(process.env.URL, data)
  console.log(resp.data)
})()
