import { logger } from '../log/logger';
import { captureHTTPsGlobal, capturePromise, setContextMissingStrategy } from 'aws-xray-sdk-core';
import http from 'http';
import https from 'https';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

if (process.env.TRACING) {
  setContextMissingStrategy('LOG_ERROR');
  captureHTTPsGlobal(http);
  captureHTTPsGlobal(https);
  capturePromise();
}

export const axiosInstance = axios.create({
  timeout: 5000,
});

axiosInstance.interceptors.request.use(async (request) => {
  const httpData = buildHttpData(request);
  logger.info(httpData, 'Executing HTTP request');
  return request;
});

axiosInstance.interceptors.response.use(
  async (response) => {
    const httpData = buildHttpData(response.config, response);
    logger.info(httpData, 'HTTP request executed');
    return response;
  },
  async (error) => {
    const httpData = buildHttpData(error.config, error.response);
    logger.error(httpData, 'Unable to execute HTTP request');
    return Promise.reject(new HttpError(error, httpData));
  },
);

const buildHttpData = (axiosRequestConfig?: AxiosRequestConfig, axiosResponse?: AxiosResponse): HttpData => {
  return {
    api: axiosRequestConfig?.baseURL,
    endpoint: axiosRequestConfig?.url?.split('?')[0],
    method: axiosRequestConfig?.method,
    params: axiosRequestConfig?.url?.split('?')[1],
    status: axiosResponse?.status,
    response: axiosResponse?.status && axiosResponse?.status >= 400 ? JSON.stringify(axiosResponse?.data) : undefined,
  };
};

interface HttpData {
  api?: string;
  endpoint?: string;
  method?: string;
  params?: string;
  status?: number;
  response?: string;
}

class HttpError extends Error {
  constructor(error: any, private errorDetails: HttpData) {
    super(error.message);
  }
}
