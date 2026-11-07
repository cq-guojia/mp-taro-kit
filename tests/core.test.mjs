import test from 'node:test'
import assert from 'node:assert/strict'
import {
  configure,
  getConfig,
  getFaces,
  resetForTests,
  request,
  get,
  post,
  joinUrl,
  navigateTo,
  navigateBack,
  buildUrl,
  storageGet,
  storageSet,
  storageRemove,
  storageClear,
  login,
  scanCode,
  requestPayment,
} from '../dist/core/index.js'

function makeFaces(overrides = {}) {
  const store = new Map()
  const calls = []
  const faces = {
    request: async (options) => {
      calls.push({ kind: 'request', options })
      return { statusCode: 200, data: { ok: true } }
    },
    getStorage: (key) => {
      calls.push({ kind: 'getStorage', key })
      return store.get(key)
    },
    setStorage: (key, value) => {
      calls.push({ kind: 'setStorage', key, value })
      store.set(key, value)
    },
    removeStorage: (key) => {
      calls.push({ kind: 'removeStorage', key })
      store.delete(key)
    },
    clearStorage: () => {
      calls.push({ kind: 'clearStorage' })
      store.clear()
    },
    navigateTo: async (options) => {
      calls.push({ kind: 'navigateTo', options })
    },
    redirectTo: async (options) => {
      calls.push({ kind: 'redirectTo', options })
    },
    switchTab: async (options) => {
      calls.push({ kind: 'switchTab', options })
    },
    navigateBack: async (delta) => {
      calls.push({ kind: 'navigateBack', delta })
    },
    reLaunch: async (options) => {
      calls.push({ kind: 'reLaunch', options })
    },
    login: async () => ({ code: 'mock-code' }),
    scanCode: async () => ({ result: 'mock-scan' }),
    requestPayment: async () => undefined,
    ...overrides,
  }
  return { faces, calls, store }
}

test('未 configure() 时每个 core 能力都抛错，消息带修复指引', async () => {
  resetForTests()
  assert.throws(() => getConfig(), /configure/)
  assert.throws(() => getFaces(), /configure/)
  await assert.rejects(request({ url: '/x' }), /configure/)
  await assert.rejects(navigateTo({ url: '/a' }), /configure/)
  assert.throws(() => storageGet('k'), /configure/)
  await assert.rejects(login(), /configure/)
  await assert.rejects(login(), /configure/)
})

test('configure() 缺字段当场抛，消息点名字段；非对象也抛', () => {
  resetForTests()
  const { faces } = makeFaces()
  assert.throws(() => configure({ ...faces, scanCode: undefined }), /scanCode/)
  assert.throws(() => configure(null), /faces 对象/)
  assert.throws(() => getFaces(), /configure/)
})

test('configure() 合并默认值与覆盖值，重复调用整体覆盖', () => {
  resetForTests()
  const { faces } = makeFaces()
  configure(faces, { baseURL: 'https://api.example.com', timeout: 500 })
  assert.equal(getConfig().baseURL, 'https://api.example.com')
  assert.equal(getConfig().timeout, 500)
  assert.equal(getConfig().storagePrefix, 'mptk:')
  assert.equal(getConfig().debug, false)
  assert.deepEqual(getConfig().headers, {})
  configure(faces)
  assert.equal(getConfig().baseURL, '')
  assert.equal(getConfig().timeout, 10_000)
})

test('request：拼 baseURL、合并 header、方法别名、绝对 URL 不拼', async () => {
  resetForTests()
  const { faces, calls } = makeFaces()
  configure(faces, { baseURL: 'https://api.example.com/', headers: { 'X-Base': '1' } })
  const res = await get('/user', { header: { 'X-One': '2' } })
  assert.equal(res.ok, true)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.data, { ok: true })
  assert.equal(calls[0].options.url, 'https://api.example.com/user')
  assert.equal(calls[0].options.method, 'GET')
  assert.deepEqual(calls[0].options.header, { 'X-Base': '1', 'X-One': '2' })
  await post('/user', { data: { a: 1 } })
  assert.equal(calls[1].options.method, 'POST')
  await request({ url: 'https://other.example.com/x' })
  assert.equal(calls[2].options.url, 'https://other.example.com/x')
  assert.equal(joinUrl('', '/plain'), '/plain')
})

test('request：非 2xx 与平台异常都返回结果对象、不抛', async () => {
  resetForTests()
  const failingStatus = makeFaces({
    request: async () => ({ statusCode: 500, data: 'server error' }),
  })
  configure(failingStatus.faces)
  const r1 = await request({ url: '/x' })
  assert.equal(r1.ok, false)
  assert.equal(r1.statusCode, 500)
  assert.equal(r1.error, undefined)
  const offline = makeFaces({
    request: async () => {
      throw new Error('offline')
    },
  })
  configure(offline.faces)
  const r2 = await request({ url: '/x' })
  assert.equal(r2.ok, false)
  assert.equal(r2.statusCode, 0)
  assert.match(r2.error, /offline/)
})

test('router：参数序列化、在途锁防连点、finally 释放、平台异常返回 false', async () => {
  resetForTests()
  const { faces, calls } = makeFaces()
  configure(faces)
  assert.equal(buildUrl('/pages/a', { id: 7, q: 'a b', skip: undefined }), '/pages/a?id=7&q=a%20b')
  assert.equal(buildUrl('/pages/a?x=1', { id: 2 }), '/pages/a?x=1&id=2')
  assert.equal(buildUrl('/pages/a'), '/pages/a')
  const [first, second] = await Promise.all([navigateTo({ url: '/a' }), navigateTo({ url: '/b' })])
  assert.deepEqual([first, second], [true, false])
  assert.equal(calls.filter((call) => call.kind === 'navigateTo').length, 1)
  assert.equal(await navigateBack(), true)
  const failing = makeFaces({
    navigateTo: async () => {
      throw new Error('route failed')
    },
  })
  configure(failing.faces)
  assert.equal(await navigateTo({ url: '/x' }), false)
  assert.equal(await navigateBack(), true)
})

test('storage：键前缀、JSON 序列化、过期、脏数据兜底、平台失败返回 false', () => {
  resetForTests()
  const { faces, calls, store } = makeFaces()
  configure(faces, { storagePrefix: 'app:' })
  assert.equal(storageSet('token', { a: 1 }), true)
  assert.equal(calls[0].key, 'app:token')
  assert.deepEqual(storageGet('token'), { a: 1 })
  assert.equal(storageSet('tmp', 1, -1), true)
  assert.equal(storageGet('tmp'), undefined)
  store.set('app:bad', '{not json')
  assert.equal(storageGet('bad'), undefined)
  store.set('app:plain', JSON.stringify({ hello: 1 }))
  assert.equal(storageGet('plain'), undefined)
  assert.equal(storageRemove('token'), true)
  assert.equal(storageGet('token'), undefined)
  assert.equal(storageClear(), true)
  const full = makeFaces({
    setStorage: () => {
      throw new Error('quota exceeded')
    },
  })
  configure(full.faces)
  assert.equal(storageSet('x', 1), false)
})

test('weapp：成功返回业务值，平台异常或脏返回按兜底处理', async () => {
  resetForTests()
  const { faces } = makeFaces()
  configure(faces)
  assert.deepEqual(await login(), { code: 'mock-code' })
  assert.equal(await scanCode(), 'mock-scan')
  assert.equal(await requestPayment({ timeStamp: '1' }), true)
  const broken = makeFaces({
    login: async () => {
      throw new Error('no network')
    },
    scanCode: async () => ({ result: 123 }),
    requestPayment: async () => {
      throw new Error('cancelled')
    },
  })
  configure(broken.faces)
  assert.equal(await login(), undefined)
  assert.equal(await scanCode(), undefined)
  assert.equal(await requestPayment({}), false)
})
