const async = require('async')
const fs = require('fs')
const sharp = require('sharp')
const mkdirp = require('mkdirp')
const path = require('path')
const gifsicle = require('./gifsicle')
const gmargs = require('./gmargs')
const ffmpeg = require('./ffmpeg')

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

  // start processing with GraphicsMagick
  const image = sharp(source)

  // read baked-in orientation info, and output a rotated image with orientation=0
  image.rotate()

  // optional watermark
  const cropping = options.width && options.height
  if (options.watermark && !cropping) {
    var opts = {}

    if (options.watermark.position === 'Repeat') {
      opts.tile = true
    } else if (typeof options.watermark.position === 'string') {
      // opts.gravity = options.watermark.position
      switch(options.watermark.position) {
        case "NorthWest":
          opts.gravity = sharp.gravity.northwest
        case "North":
          opts.gravity = sharp.gravity.north
          break
        case "NorthEast":
          opts.gravity = sharp.gravity.northeast
          break
        case "West":
          opts.gravity = sharp.gravity.west
          break
        case "East":
          opts.gravity = sharp.gravity.east
          break
        case "SouthWest":
          opts.gravity = sharp.gravity.southwest
          break
        case "South":
          opts.gravity = sharp.gravity.south
          break
        case "SouthEast":
        default:
          opts.gravity = sharp.gravity.southeast
          break
      }
    } else {
      opts.gravity = sharp.gravity.southeast
    }

    image.overlayWith(options.watermark.file, opts)
  }

  // resize if necessary
  if (cropping) {
    // crop to the exact height and weight
    image.resize(options.width, options.height, '^')
    image.crop(options.width, options.height)
    // image.out('+repage')
  } else if (options.height) {
    // resize to a maximum height
    image.resize(null, options.height, '>')
  } else if (options.width) {
    // resize to a maximum width
    image.resize(options.width, null, '>')
  }

  // default quality, for typical web-friendly sizes
  // image.quality(options.quality || 90)
  options.quality = options.quality || 90
  // apply custom post-processing arguments (sharpen, brightness...)
  gmargs.apply(image, options.args)
  // write the output image
  try {
    image.write(target, callback)
  } catch (err) {
    console.error(err)
  }
}

/*
  Transcode and/or downsample a video
*/

exports.video = function (source, target, options, callback) {
  // create target folder if needed
  mkdirp.sync(path.dirname(target))
  // always output to mp4 which is well read on the web
  const args = ['-i', source, '-r', '25', '-vsync', '2', '-movflags', '+faststart', '-y', target, '-f', 'mp4', '-vcodec', 'libx264', '-ab', '96k']
  // AVCHD/MTS videos need a full-frame export to avoid interlacing artefacts
  if (path.extname(source).toLowerCase() === '.mts') {
    args.push('-vf', 'yadif=1', '-qscale:v', '4')
  } else {
    args.push('-vb', '1200k')
  }
  // return a EventEmitter to follow progress, since this can take a long time
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
