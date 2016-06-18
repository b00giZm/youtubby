const fs = require('fs');
const EventEmitter = require('events');
const request = require('request');
const mime = require('mime');
const tmp = require('tmp');

class Downloader extends EventEmitter {
  load(url) {
    let totalBytes = 0;

    return new Promise((resolve, reject) => {
      request
        .head(url)
        .on('response', resp => {
          const ext = mime.extension(resp.headers['content-type']);
          const contentLength = resp.headers['content-length'];

          let totalBytes = 0;
          let totalPercentage = 0;

          const tmpFile = tmp.fileSync({ keep: true, postfix: `.${ext}` });

          request
            .get(url)
            .on('data', buf => {
              totalBytes += Buffer.byteLength(buf);

              const newTotalPercentage = Math.floor(totalBytes/contentLength*100);
              if (newTotalPercentage > totalPercentage) {
                totalPercentage = newTotalPercentage;
                this.emit('progress', totalPercentage);
              }
            })
            .on('end', () => resolve(tmpFile))
            .on('error', reject)
            .pipe(fs.createWriteStream(tmpFile.name))
          ;
        })
      ;
    });
  }
}

module.exports = new Downloader();
