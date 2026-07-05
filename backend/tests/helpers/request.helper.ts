import supertest from 'supertest';
import app from '../../src/app';
import { recordInteraction } from './test-meta';

const rawApi = supertest(app);

function instrument(
  method: string,
  endpoint: string,
  req: supertest.Test,
  initialBody?: any
): supertest.Test {
  let capturedBody = initialBody;

  const originalSend = req.send.bind(req);
  req.send = function (data: any) {
    // If they chain .send(), capture or merge it
    capturedBody = capturedBody ? { ...capturedBody, ...data } : data;
    return originalSend(data);
  };

  const originalThen = req.then.bind(req);
  req.then = function (resolve?: any, reject?: any) {
    return originalThen((res: supertest.Response) => {
      recordInteraction({
        method: method.toUpperCase(),
        endpoint,
        requestBody: capturedBody,
        responseStatus: res.status,
        responseBody: res.body,
      });
      return resolve ? resolve(res) : res;
    }, reject);
  };
  return req;
}

export const api = {
  get: (url: string) => instrument('GET', url, rawApi.get(url)),
  post: (url: string, body?: any) => instrument('POST', url, rawApi.post(url).send(body), body),
  patch: (url: string, body?: any) => instrument('PATCH', url, rawApi.patch(url).send(body), body),
  put: (url: string, body?: any) => instrument('PUT', url, rawApi.put(url).send(body), body),
  delete: (url: string) => instrument('DELETE', url, rawApi.delete(url)),
};

export function authRequest(token: string) {
  const header = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => instrument('GET', url, rawApi.get(url).set(header)),
    post: (url: string, body?: any) => instrument('POST', url, rawApi.post(url).set(header).send(body), body),
    patch: (url: string, body?: any) => instrument('PATCH', url, rawApi.patch(url).set(header).send(body), body),
    put: (url: string, body?: any) => instrument('PUT', url, rawApi.put(url).set(header).send(body), body),
    delete: (url: string) => instrument('DELETE', url, rawApi.delete(url).set(header)),
  };
}
