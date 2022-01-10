const pathToFfmpeg = require('ffmpeg-static')
console.log(pathToFfmpeg)

const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(pathToFfmpeg)

const command = ffmpeg('input.avi').format('mp4')
command.save('output.mp4')

const cmd = ffmpeg('input.wav').format('mp3')
cmd.save('output.mp3')
