 exports.easyServerless = (data, context) => {
  const { name } = data
  console.log(`The file name: ${name}`)
  return
}
