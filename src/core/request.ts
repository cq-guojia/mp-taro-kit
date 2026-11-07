import { getConfig, getFaces } from './configure.js'
import type { HttpMethod, PlatformRequestOptions } from './faces.js'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: unknown
  header?: Record<string, string>
  timeout?: number
}

export interface HttpResult<T> {
  ok: boolean
  statusCode: number
  data: T | undefined
  error: string | undefined
}

export function joinUrl(baseURL: string, url: string): string {
  if (/^https?:\/\//.test(url)) return url
  if (baseURL === '') return url
  return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

/**
 * 网络失败属于「用户在场」⇒ 返回结果对象而非抛异常；
 * 未 configure() 属于「开发者在场」⇒ getConfig / getFaces 直接抛。
 */
export async function request<T = unknown>(options: RequestOptions): Promise<HttpResult<T>> {
  const config = getConfig()
  const faces = getFaces()
  const outgoing: PlatformRequestOptions = {
    url: joinUrl(config.baseURL, options.url),
    method: options.method ?? 'GET',
    data: options.data,
    header: { ...config.headers, ...options.header },
    timeout: options.timeout ?? config.timeout,
  }
  try {
    const response = await faces.request<T>(outgoing)
    const statusCode = Number.isFinite(response.statusCode) ? response.statusCode : 0
    return {
      ok: statusCode >= 200 && statusCode < 300,
      statusCode,
      data: response.data,
      error: undefined,
    }
  } catch (error) {
    return { ok: false, statusCode: 0, data: undefined, error: String(error) }
  }
}

type WithoutUrlMethod = Omit<RequestOptions, 'url' | 'method'>

export function get<T = unknown>(url: string, options: WithoutUrlMethod = {}): Promise<HttpResult<T>> {
  return request<T>({ ...options, url, method: 'GET' })
}

export function post<T = unknown>(url: string, options: WithoutUrlMethod = {}): Promise<HttpResult<T>> {
  return request<T>({ ...options, url, method: 'POST' })
}

export function put<T = unknown>(url: string, options: WithoutUrlMethod = {}): Promise<HttpResult<T>> {
  return request<T>({ ...options, url, method: 'PUT' })
}

export function patch<T = unknown>(url: string, options: WithoutUrlMethod = {}): Promise<HttpResult<T>> {
  return request<T>({ ...options, url, method: 'PATCH' })
}

export function remove<T = unknown>(url: string, options: WithoutUrlMethod = {}): Promise<HttpResult<T>> {
  return request<T>({ ...options, url, method: 'DELETE' })
}
