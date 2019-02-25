const assert = require('assert')
const tape = require('tape')
const diff = require('./diff')
const convert = require('../../lib/index')

tape('can downsample a video for a smaller filesize', (test) => {
  diff.video(test, {
    input: 'videos/countdown.mp4',
    expect: 'videos/countdown-small.mp4',
    options: {}
  })
})

tape('can convert a video to webm', (test) => {
  diff.video(test, {
    input: 'videos/short.mp4',
    expect: 'videos/short.webm',
    options: {
      format: 'webm'
    }
  })
})

tape('can convert to MP4 with a target bitrate', (test) => {
  diff.video(test, {
    input: 'videos/countdown.mp4',
    expect: 'videos/countdown-bitrate.mp4',
    options: {
      format: 'mp4',
      bitrate: '100k'
    }
  })
})

tape('can convert to WEBM with a target bitrate', (test) => {
  diff.video(test, {
    input: 'videos/countdown.mp4',
    expect: 'videos/countdown-bitrate.webm',
    options: {
      format: 'webm',
      bitrate: '100k'
    }
  })
})

tape('can convert to MP4 with a target quality', (test) => {
  diff.video(test, {
    input: 'videos/countdown.mp4',
    expect: `videos/countdown-quality.mp4`,
    options: {
      format: 'mp4',
      quality: 50
    }
  })
})

tape('can convert to WEBM with a target quality', (test) => {
  diff.video(test, {
    input: 'videos/countdown.mp4',
    expect: 'videos/countdown-quality.webm',
    options: {
      format: 'webm',
      quality: 50
    }
  })
})

tape('can report progress when processing videos', (t) => {
  const report = []
  const input = 'test-data/input/videos/big_buck_bunny.mp4'
  const actual = 'test-data/actual/videos/big_buck_bunny.mp4'
  const progress = convert.video(input, actual, {}, (err) => {
    assertIncreasing(report)
    t.end(err)
  })
  progress.on('progress', percent => {
    process.stderr.write(`${percent}% `)
    report.push(percent)
  })
})

function assertIncreasing (list) {
  assert(list.length > 0, `The list should not be empty`)
  var last = -1
  for (var i = 0; i < list.length; ++i) {
    assert(list[i] >= last, `Number ${list[i]} should be greater than previous number ${last}`)
    last = list[i]
  }
}
