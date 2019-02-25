const downsize = require('./lib/index.js')
// const { exec } = require('child_process');

const dir = '../../Desktop/test/'

for (var i = 1; i < 9; i++) {
  const filename = 'test' + i + '.jpg'

  downsize.image(
    dir + 'input/' + filename,
    dir + 'output/' + filename,
    { width: 250 },
    () => {}
  )
}

// setTimeout(
//     () => exec(
//         'exiftool -Orientation= *.jpg && ' +
//         'rm *jpg_original && ' +
//         'exiftool *.jpg | grep Orientation && ' +
//         'feh *.jpg' +
//         '',

//         { cwd: dir + 'output' },
//         (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`exec error: ${error}`);
//                 return;
//             }
//             console.log(`stdout\n----------\n${stdout}`);
//             console.log(`stderr\n----------\n${stderr}`);
//         }
//     )
// , 2500);
