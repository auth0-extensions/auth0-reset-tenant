import requestLib from 'request';
import util from 'util';

function wrapRequest (funcName, opts, successStatusCodes, what) {
  successStatusCodes = Array.isArray(successStatusCodes) ?
    successStatusCodes :
    [ successStatusCodes ];

  return new Promise((resolve, reject) => requestLib[funcName](opts, (err, response, body) => {
    if (err) return reject(err);
    if (response.statusCode === 404) return resolve();
    if (!successStatusCodes.includes(response.statusCode)) return reject(
      new Error(`Unsuccessful response attempting to ${what}: status=${response.statusCode}, body=
${typeof(body) === 'object' ? util.inspect(body) : body}`));

    resolve(body);
  }));
}

export const get =   (opts, what, status = 200) => wrapRequest('get', opts, status, what);
export const post =  (opts, what, status = [ 200, 201 ]) => wrapRequest('post', opts, status, what);
export const del =   (opts, what, status = 204) => wrapRequest('del', opts, status, what);
export const patch = (opts, what, status = 200) => wrapRequest('patch', opts, status, what);
export const put =   (opts, what, status = 200) => wrapRequest('put', opts, status, what);
