import test from 'node:test'
import assert from 'node:assert/strict'
import { createOverlayStack } from '../dist/runtime/index.js'
import { createOverlayLifecycle } from '../dist/ui/infra/overlay-lifecycle.js'

test('生命周期：close 只标 exiting 且结算一次，finish 才物理移除', () => {
  const stack = createOverlayStack()
  const lifecycle = createOverlayLifecycle(stack)
  const id = lifecycle.open({ text: 'a' }, 'page-a')
  let settled = 0
  assert.equal(lifecycle.close(id, () => { settled += 1 }), true, '第一次 close 生效')
  assert.equal(lifecycle.close(id, () => { settled += 1 }), false, '重复 close 不重复结算')
  assert.equal(settled, 1)
  assert.equal(stack.getSnapshot().length, 1, 'close 不删载荷，节点还在树上')
  assert.equal(stack.getSnapshot()[0].phase, 'exiting')
  assert.equal(lifecycle.finish(id), true, 'finish 物理移除')
  assert.equal(lifecycle.finish(id), false, '迟到 finish 幂等')
  assert.equal(stack.getSnapshot().length, 0)
})

test('生命周期：scope 认领与 owner 归属，exiting 期间 owner 不释放不被抢', () => {
  const lifecycle = createOverlayLifecycle(createOverlayStack())
  const id = lifecycle.open({ text: 'x' }, 'page-a')
  assert.equal(lifecycle.claim(id, 'host-a', 'page-b'), false, '别的页面不认领')
  assert.equal(lifecycle.claim(id, 'host-a', 'page-a'), true, '本页宿主认领')
  assert.equal(lifecycle.claim(id, 'host-b', 'page-a'), false, '已有 owner 不被抢')
  lifecycle.close(id)
  assert.equal(lifecycle.owns(id, 'host-a'), true, '退场期间 owner 保留')
  assert.equal(lifecycle.claim(id, 'host-b', 'page-a'), false, '退场条目不重新认领')
  lifecycle.finish(id)
  assert.equal(lifecycle.owns(id, 'host-a'), false, 'finish 后释放 owner')
})

test('useSyncExternalStore 快照必须稳定：无变化时 getSnapshot 返回同一引用', () => {
  const lifecycle = createOverlayLifecycle(createOverlayStack())
  const empty = lifecycle.getSnapshot()
  assert.equal(lifecycle.getSnapshot(), empty, '空栈重复读必须同一引用')
  const id = lifecycle.open({ text: 'a' }, 'page-a')
  const one = lifecycle.getSnapshot()
  assert.equal(lifecycle.getSnapshot(), one, '无变化重复读必须同一引用')
  assert.equal(lifecycle.getSnapshot(), one, '多次读仍同一引用')
  lifecycle.close(id)
  assert.notEqual(lifecycle.getSnapshot(), one, '栈变化后换成新快照')
  const exiting = lifecycle.getSnapshot()
  assert.equal(lifecycle.getSnapshot(), exiting, 'exiting 态无变化时仍稳定')
})

test('生命周期：dismiss 强制移除必须清掉 seq/scope 映射，不泄漏', () => {
  const lifecycle = createOverlayLifecycle(createOverlayStack())
  const id = lifecycle.open({ text: 'a' }, 'page-a')
  const seq = lifecycle.seqOf(id)
  assert.equal(seq > 0, true)
  assert.equal(lifecycle.dismiss(id)?.text, 'a', 'dismiss 交还 payload')
  assert.equal(lifecycle.seqOf(id), 0, 'seq 映射随 dismiss 清除')
  assert.equal(lifecycle.dismiss(id), undefined, '重复 dismiss 幂等')
  assert.equal(lifecycle.getSnapshot().length, 0)
})

test('生命周期：seq 代际让关闭后的旧异步回调作废', () => {
  const lifecycle = createOverlayLifecycle(createOverlayStack())
  const id = lifecycle.open({ text: 'async' }, undefined)
  const seq = lifecycle.seqOf(id)
  assert.equal(lifecycle.isCurrent(id, seq), true)
  lifecycle.close(id)
  assert.equal(lifecycle.isCurrent(id, seq), false, 'close 后旧 seq 作废')
  assert.equal(lifecycle.isCurrent(id, lifecycle.seqOf(id)), false, 'exiting 不算 current')
})

test('生命周期：clear 兜底逐个结算并清空归属，幂等', () => {
  const stack = createOverlayStack()
  const lifecycle = createOverlayLifecycle(stack)
  lifecycle.open({ text: 'a' }, 'page-a')
  lifecycle.open({ text: 'b' }, 'page-b')
  const settled = []
  lifecycle.clear((payload) => settled.push(payload.text))
  assert.deepEqual(settled, ['a', 'b'])
  assert.equal(stack.getSnapshot().length, 0)
  lifecycle.clear((payload) => settled.push(payload.text))
  assert.equal(settled.length, 2, '空栈 clear 不再结算')
})

test('生命周期：clear 不二次结算 exiting 条目，保留用户在 close 时的选择', () => {
  const stack = createOverlayStack()
  const lifecycle = createOverlayLifecycle(stack)
  const settled = []
  lifecycle.open({ text: 'open' }, 'page-a')
  const closingId = lifecycle.open({ text: 'exiting' }, 'page-b')
  lifecycle.close(closingId, () => settled.push('exiting'))
  // 宿主卸载兜底：此时一条 open、一条 exiting 仍在栈里。
  lifecycle.clear((payload) => settled.push(payload.text))
  assert.deepEqual(settled, ['exiting', 'open'], 'exiting 只结算一次，open 由兜底补结算')
  assert.equal(stack.getSnapshot().length, 0)
  assert.equal(lifecycle.getSnapshot().length, 0)
})

test('栈 phase：dismiss 仍是立即物理删除，与 close/finish 分离', () => {
  const stack = createOverlayStack()
  const id = stack.push({ text: 'x' })
  assert.equal(stack.getSnapshot()[0].phase, 'open')
  assert.equal(stack.markExiting(id)?.phase, 'exiting')
  assert.equal(stack.finishExiting(id)?.text, 'x')
  const other = stack.push({ text: 'y' })
  assert.equal(stack.dismiss(other)?.text, 'y', 'dismiss 不要求先 exiting')
})
