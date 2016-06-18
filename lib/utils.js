const fs      = require('fs');
const qs      = require('querystring');
const request = require('request');
const map     = require('lodash.map');
const filter  = require('lodash.filter');
const zip     = require('lodash.zip');

// helpers
const arrayZip = (arr) => zip.apply(zip, arr);
const parse    = qs.parse;
const isArray  = Array.isArray;

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const videoTitleFromId = (id) => {
  const infoUrl  = `http://youtube.com/get_video_info?video_id=${id}&el=detailpage&ps=default&eurl=&gl=US&hl=en`;

  return new Promise((resolve, reject) => {
    return request(infoUrl, (err, res, body) => {
      if (err) {
        return reject(err);
      }

      resolve(slugify(parse(body).title));
    })
  })
};

const videoUrlFromId = (id, mimeType = 'video/mp4') => {
  const infoUrl  = `http://youtube.com/get_video_info?video_id=${id}&el=detailpage&ps=default&eurl=&gl=US&hl=en`;

  return new Promise((resolve, reject) => {
    return request(infoUrl, (err, res, body) => {
      if (err) {
        return reject(err);
      }

      const streamMap = parse(parse(body)['url_encoded_fmt_stream_map']);

      // So, Google makes us jump through some hoops here ...
      const keys = filter(['type', 'quality', 'url'], key => isArray(streamMap[key]));
      const streams = map(arrayZip(map(keys, key => streamMap[key])), arr => arr.join(','));

      const mimeRegex = `mime=${encodeURIComponent(mimeType)}`;
      const filtered = filter(streams, stream => (new RegExp(mimeRegex)).test(stream));

      // We give up and notify the user to run the script again
      if (!isArray(filtered) || !filtered.length) {
        return reject(new Error('Could not get raw URL, try again!'));
      }

      // Try to extract the URL from the big blob
      const result = /http(s?):\/\/[^,]+/.exec(filtered[0]);
      if (!result) {
        return reject(new Error('Could not get raw URL, try again!'));
      }

      // Just return the first result for now
      return resolve(result[0]);
    });
  });
};

module.exports = { videoTitleFromId, videoUrlFromId };
