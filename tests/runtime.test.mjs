import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isThenable,
  isSuccess,
  createSingleton,
  createOverlayStack,
  createNotifyCenter,
  createLoadingSlot,
} from '../dist/runtime/index.js'

test('thenable：只判定，不 await、不吞错、不改原值', () => {
  const pending = Promise.resolve(1)
  assert.equal(isThenable(pending), true)
  const callableThen = {}
  Object.defineProperty(callableThen, 'then', { value: () => {} })
  assert.equal(isThenable(callableThen), true)
  const nonCallableThen = {}
  Object.defineProperty(nonCallableThen, 'then', { value: 1 })
  assert.equal(isThenable(nonCallableThen), false)
  assert.equal(isThenable(null), false)
  assert.equal(isThenable(undefined), false)
  assert.equal(isThenable('x'), false)
  assert.equal(isSuccess(true), true)
  assert.equal(isSuccess(undefined), true)
  assert.equal(isSuccess(0), true)
  assert.equal(isSuccess(null), true)
  assert.equal(isSuccess(false), false)
})

test('singleton：同 key 懒建一次，不同 key 互不干扰', () => {
  let calls = 0
  const first = createSingleton('test-runtime/singleton-a', () => {
    calls += 1
    return { tag: 'a' }
  })
  const second = createSingleton('test-runtime/singleton-a', () => {
    calls += 1
    return { tag: 'other' }
  })
  assert.equal(calls, 1)
  assert.equal(first, second)
  const other = createSingleton('test-runtime/singleton-b', () => ({ tag: 'b' }))
  assert.notEqual(first, other)
})

test('singleton + stack：两个副本拿到同一份栈', () => {
  const first = createSingleton('test-runtime/overlay-stack', () => createOverlayStack())
  first.push('共享条目')
  const second = createSingleton('test-runtime/overlay-stack', () => createOverlayStack())
  assert.equal(first, second)
  assert.equal(second.getSnapshot().length, 1)
})

test('overlay-stack：push / dismiss 交还 payload，快照引用稳定', () => {
  const stack = createOverlayStack()
  const empty = stack.getSnapshot()
  const idOne = stack.push({ title: '第一条' })
  const idTwo = stack.push({ title: '第二条' })
  assert.equal(idTwo, idOne + 1)
  assert.equal(stack.getSnapshot().length, 2)
  assert.notEqual(stack.getSnapshot(), empty)
  const stable = stack.getSnapshot()
  assert.equal(stack.getSnapshot(), stable)
  assert.deepEqual(stack.dismiss(idOne), { title: '第一条' })
  assert.equal(stack.dismiss(idOne), undefined)
  assert.equal(stack.getSnapshot().length, 1)
})

test('overlay-stack：状态真变才通知，无效操作返回兜底不抛', () => {
  const stack = createOverlayStack()
  let hits = 0
  const off = stack.subscribe(() => {
    hits += 1
  })
  stack.push('x')
  assert.equal(hits, 1)
  assert.equal(stack.clear().length, 1)
  assert.equal(hits, 2)
  assert.deepEqual(stack.clear(), [])
  assert.equal(stack.dismiss(999), undefined)
  assert.equal(hits, 2)
  off()
  stack.push('y')
  assert.equal(hits, 2)
  assert.equal(stack.getSnapshot().length, 1)
})

test('notify：队列上限挤掉最旧，文案与 tone 原样保留', () => {
  const center = createNotifyCenter(2)
  const idOne = center.show('第一条')
  center.show('第二条', 'warn')
  center.show('第三条', 'error')
  assert.deepEqual(center.getSnapshot().map((notice) => notice.text), ['第二条', '第三条'])
  assert.equal(center.getSnapshot()[0].tone, 'warn')
  assert.equal(center.dismiss(idOne), false)
  assert.equal(center.dismiss(999), false)
  assert.equal(center.clear().length, 2)
  assert.equal(center.getSnapshot().length, 0)
  assert.deepEqual(center.clear(), [])
})

test('notify：非法 limit 回落到默认档，默认 tone 为 info', () => {
  const center = createNotifyCenter(0)
  let hits = 0
  const off = center.subscribe(() => {
    hits += 1
  })
  center.show('a')
  center.show('b')
  center.show('c')
  center.show('d')
  assert.equal(center.getSnapshot().length, 3)
  assert.equal(center.getSnapshot()[0].text, 'b')
  assert.equal(center.getSnapshot()[0].tone, 'info')
  assert.equal(hits, 4)
  off()
  center.show('e')
  assert.equal(hits, 4)
})

test('loading-slot：句柄配对，重复 hide 不误关别人的', () => {
  const slot = createLoadingSlot()
  assert.deepEqual(slot.getSnapshot(), { active: false, count: 0 })
  const idOne = slot.show()
  const idTwo = slot.show()
  assert.deepEqual(slot.getSnapshot(), { active: true, count: 2 })
  assert.equal(slot.hide(idOne), true)
  assert.equal(slot.hide(idOne), false)
  assert.deepEqual(slot.getSnapshot(), { active: true, count: 1 })
  assert.equal(slot.hide(idTwo), true)
  assert.deepEqual(slot.getSnapshot(), { active: false, count: 0 })
  assert.equal(slot.hide(999), false)
  assert.equal(slot.getSnapshot(), slot.getSnapshot())
})

test('loading-slot：计数变化才通知，快照引用在状态不变时稳定', () => {
  const slot = createLoadingSlot()
  let hits = 0
  const off = slot.subscribe(() => {
    hits += 1
  })
  const idOne = slot.show()
  assert.equal(hits, 1)
  const stable = slot.getSnapshot()
  assert.equal(slot.getSnapshot(), stable)
  slot.show()
  assert.equal(hits, 2)
  slot.hide(idOne)
  assert.equal(hits, 3)
  assert.equal(slot.hide(idOne), false)
  assert.equal(hits, 3)
  off()
})
