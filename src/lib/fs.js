import rimraf from 'rimraf';
import fs from 'fs';

export function rmdir (path) {
  return new Promise((resolve, reject) => 
    rimraf(path, err => {
      if (err) return reject(err);

      resolve(path);
    }));
}

export function mkdir (path) {
  return new Promise((resolve, reject) => 
    fs.mkdir(path, err => {
      if (err) return reject(err);

      resolve(path);
    }));
}

export function cp (source, target) {
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source);
    rd.on('error', rejectCleanup);
    const wr = fs.createWriteStream(target);
    wr.on('error', rejectCleanup);

    function rejectCleanup (err) {
      rd.destroy();
      wr.end();
      reject(err);
    }

    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}

export function ls (path) {
  return new Promise((resolve, reject) => 
    fs.readdir(path, (err, files) => {
      if (err) return reject(err);

      resolve(files);
    }));
}
