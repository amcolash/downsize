const async = require('async')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const gifsicle = require('./image/gifsicle')
const gmagick = require('./image/gmagick')
const ffmpeg = require('./video/ffmpeg')
const ffargs = require('./video/ffargs')

const GIF_FILE = /\.gif$/i

/*
  Convert and/or resize an image
*/
exports.image = function (source, target, options, callback) {
  // create target folder if needed
  mkdirp.sync(path.dirname(target))

  // when processing a GIF
  // - if asking for an animated target, process with Gifsicle
  // - otherwise only process the first frame
  if (source.match(GIF_FILE)) {
    if (options.animated) {
      return gifsicle.createAnimatedGif(source, target, options, callback)
    } else {
      source += '[0]'
    }
  }

  // process the image with GraphicsMagick
  const image = gmagick.prepare(source, options)
  image.write(target, callback)
}

/*
  Transcode and/or downsample a video
*/

exports.video = function (source, target, options, callback) {
  // create target folder if needed
  mkdirp.sync(path.dirname(target))

  // run ffmpeg to create the downsized video
  const args = ffargs.prepare(source, target, options)
  return ffmpeg.exec(args, callback)
}

/*
  Extract and resize a still frame from a video
*/
exports.still = function (source, target, options, callback) {
  // create target folder if needed
  mkdirp.sync(path.dirname(target))
  async.series([
    (next) => extractFrame(source, target, next),
    (next) => exports.image(target, target, options, next)
  ], callback)
}

function extractFrame (source, target, callback) {
  const args = ['-i', source, '-vframes', 1, '-y', target]
  ffmpeg.exec(['-ss', '0.1'].concat(args), (err) => {
    if (fs.existsSync(target)) {
      callback(err)
    } else {
      ffmpeg.exec(args, callback)
    }
  })
}
