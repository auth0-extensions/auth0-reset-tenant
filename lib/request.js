import requestLib from 'request';
import util from 'util';

function wrapRequest (funcName, opts, successStatusCode, what) {
  return new Promise((resolve, reject) => requestLib[funcName](opts, (err, response, body) => {
    if (err) return reject(err);
    if (response.statusCode === 404) return resolve();
    if (response.statusCode !== successStatusCode) return reject(
      new Error(`Unsuccessful response attempting to ${what}: status=${response.statusCode}, body=
${typeof(body) === 'object' ? util.inspect(body) : body}`));

    resolve(body);
  }));
}

export const get =   (opts, what) => wrapRequest('get', opts, 200, what);
export const post =  (opts, what) => wrapRequest('post', opts, 200, what);
export const del =   (opts, what) => wrapRequest('del', opts, 204, what);
export const patch = (opts, what) => wrapRequest('patch', opts, 200, what);
export const put =   (opts, what) => wrapRequest('put', opts, 200, what);
