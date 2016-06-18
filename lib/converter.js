const EventEmitter = require('events');
const ffmpeg  = require('fluent-ffmpeg');

class Converter extends EventEmitter {
  toMP3(filename, removeCallback, { outfile = 'out.mp3' } = {}) {
    return new Promise((resolve, reject) => {
      ffmpeg(filename)
        .on('progress', this.emit)
        .on('end', () => {
          removeCallback();
          resolve();
        })
        .on('error', () => {
          removeCallback();
          reject();
        })
        .save(outfile)
      ;
    });
  }
}

module.exports = new Converter();
