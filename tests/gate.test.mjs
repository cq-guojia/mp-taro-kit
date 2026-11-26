/**
 * 浮层闸门自检：判定真源是零平台依赖的纯函数，Node 可直接加载产物验证，
 * 不靠「源码里有没有这行」的字符串断言。控件与命令式动作都必须走同一个 decideGate。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const { decideGate, mergeNestedLock, UNLOCKED_GATE } = await import(
  pathToFileURL(join(root, 'dist/ui/infra/popup-lock/decide.js')).href
)

const read = (relative) => readFileSync(join(root, relative), 'utf8')

test('闸门判定只有一个真源：零依赖 decide 模块可独立加载', () => {
  const source = read('src/ui/infra/popup-lock/decide.ts')
  assert.doesNotMatch(source, /from ['"](react|@tarojs|react-dom)/, '判定真源不得依赖平台或 React')
  assert.ok(existsSync(join(root, 'dist/ui/infra/popup-lock/decide.js')), '判定真源须进 dist')
})

test('decideGate：未锁时恒可交互，锁定时只有白名单 key 放行', () => {
  assert.deepEqual(decideGate(UNLOCKED_GATE, 'confirm'), { blocked: false, exempt: false, locked: false })
  assert.deepEqual(decideGate(UNLOCKED_GATE), { blocked: false, exempt: false, locked: false })

  const locked = { blocked: true, exceptions: ['cancel', 'close'] }
  assert.deepEqual(decideGate(locked, 'cancel'), { blocked: true, exempt: true, locked: false })
  assert.deepEqual(decideGate(locked, 'close'), { blocked: true, exempt: true, locked: false })
  assert.deepEqual(decideGate(locked, 'confirm'), { blocked: true, exempt: false, locked: true })
  // 没 key 的控件（Switch / Cell 默认）不能申请例外，锁定时一律锁住。
  assert.deepEqual(decideGate(locked), { blocked: true, exempt: false, locked: true })
})

test('decideGate：例外放行不依赖 key 顺序，也不误放行前缀相同的 key', () => {
  const state = { blocked: true, exceptions: ['action-save', 'cancel'] }
  assert.equal(decideGate(state, 'action-save').exempt, true)
  assert.equal(decideGate(state, 'action').exempt, false, '不能用前缀命中例外')
  assert.equal(decideGate(state, 'save').exempt, false)
  const reversed = { blocked: true, exceptions: [...state.exceptions].reverse() }
  assert.deepEqual(decideGate(reversed, 'action-save'), decideGate(state, 'action-save'))
})

test('嵌套锁例外取交集：内层不能放行外层没放的 key', () => {
  const outerLocked = { blocked: true, exceptions: [] }
  const inner = { blocked: true, exceptions: ['save'] }
  const merged = mergeNestedLock(outerLocked, inner)
  assert.equal(decideGate(merged, 'save').locked, true, '外层全锁时，内层放的 key 仍须锁住')

  const bothAllow = mergeNestedLock({ blocked: true, exceptions: ['save'] }, inner)
  assert.equal(decideGate(bothAllow, 'save').locked, false, '两层都放行才可点')

  const noInnerExceptions = mergeNestedLock(outerLocked, { blocked: true })
  assert.equal(decideGate(noInnerExceptions, 'save').locked, true, '内层没声明例外 = 继承外层约束')

  const outerUnlocked = mergeNestedLock(UNLOCKED_GATE, inner)
  assert.equal(decideGate(outerUnlocked, 'save').locked, false, '外层未锁时内层例外照常生效')
})

test('控件统一从 useControlGate 接入，不再散写闸门判定', () => {
  for (const file of [
    'src/ui/actions/Button.tsx',
    'src/ui/form/switch/Switch.tsx',
    'src/ui/form/segmented/Segmented.tsx',
    'src/ui/display/cell/Cell.tsx',
  ]) {
    const source = read(file)
    assert.match(source, /useControlGate\(/, `${file} 必须从统一协议接入闸门`)
    assert.doesNotMatch(source, /isPopupLockExempt|usePopupLock\(/, `${file} 不得自建第二套判定`)
  }
})

test('命令式动作与 UI 层共用同一判定，cancel 不再绕过闸门', () => {
  const host = read('src/ui/infra/DialogHost.tsx')
  assert.match(host, /decideGate\(gateFor\(/, '所有按钮动作经统一闸门判定')
  const run = /const runAction = ([\s\S]*?)\n[ ]{2}const actionsOf/.exec(host)?.[1] ?? ''
  const gateCheck = run.indexOf('decideGate(')
  const cancelBranch = run.indexOf("key === 'cancel'")
  assert.ok(gateCheck >= 0 && cancelBranch > gateCheck, 'cancel 分支必须排在闸门判定之后')
  assert.doesNotMatch(host, /locked=\{false\}/, '不再硬编码解锁状态')
  assert.match(host, /payload\.onFailed\?\.\(key\)/, '失败出口真被调用，不是空契约')
  // 转圈与屏蔽解耦：loading 只认正在跑的动作 key，不再把所有被锁按钮一起转。
  assert.match(host, /spinning = pending\.includes\(action\.key\)/, '只有用户点的那个按钮转圈')
  assert.match(host, /startAction\(id, key\)/, '点下时登记正在跑的动作')
  assert.match(host, /disabled:\s*decision\.locked && !spinning/, '其余被锁按钮置灰，转圈的那个不灰')
  assert.doesNotMatch(host, /loading:\s*decideGate\([^)]*\)\.locked/, '闸门判定结果不能直接当 loading')
  // 例外允许并发：按 key 集合结算，先结束的不能清掉仍在跑的另一个。
  assert.match(host, /activeRef\.current\.get\(id\)/, '活跃动作按弹窗分组记 key 集合')
  assert.match(host, /if \(settled\) setBusyIds/, '只有最后一个动作结束才解锁整框')
  assert.match(host, /settleAction\(id, key\)/, '失败只结算自己的动作')
  const button = read('src/ui/actions/Button.tsx')
  assert.match(button, /disabled \|\| \(gate\.locked && !loading\) \? 'mptk-btn--disabled'/, '按钮自身也按闸门显禁用态，转圈例外')
  assert.match(button, /if \(!isThenable\(result\)\) \{[\s\S]*?onFailed\?\.\(\)/, '同步 false 也兑现 onFailed')
  const options = read('src/ui/commands.ts')
  assert.match(options, /onFailed:\s*options\.onFailed/, '失败反馈进入命令式契约')
  const popup = read('src/ui/layout/Popup.tsx')
  assert.match(popup, /isPopupLockExempt\('overlay', lockState\)/, '遮罩关闭经同一闸门判定')
  assert.match(popup, /mergeNestedLock\(/, '嵌套锁例外走统一合并判定')

  // WebView 下逻辑放行还不够，四类例外控件都要恢复命中，否则父容器 none 吞掉点击。
  const css = read('dist/ui/layout/style/index.css')
  for (const cls of ['mptk-btn', 'mptk-switch', 'mptk-seg', 'mptk-cell']) {
    assert.match(css, new RegExp(`\\.mptk-popup--blocked \\.${cls}--lock-exempt`), `${cls} 例外缺命中恢复`)
  }
})

test('异步块三个按钮覆盖三档闸门：异步、全屏蔽、单例外', () => {
  const demo = read('demo/src/pages/dialog/index.tsx')
  const fnBody = (name) => new RegExp(`const ${name} = \\(\\) => \\{([\\s\\S]*?)\\n[ ]{2}\\}`).exec(demo)?.[1] ?? ''

  const busy = fnBody('openBusy')
  assert.match(busy, /onConfirm:/, '异步要由 onConfirm 的 Promise 驱动')
  assert.match(busy, /onFailed: \([^)]*\) => showToast/, '失败必须给出可见反馈')
  assert.match(busy, /reject\(new Error/, '要真的走 reject 路径，不只是 resolve')
  assert.doesNotMatch(busy, /lockExceptions/, '默认异步不配例外，沿用库默认放行 cancel')

  const block = fnBody('openBusyBlock')
  assert.match(block, /lockExceptions: \[\]/, '全屏蔽要显式清空默认例外')
  assert.match(block, /closeable: true/, '打开关闭叉，读者才能验证锁')
  assert.match(block, /maskClosable: true/, '打开遮罩关闭，读者才能验证锁')
  assert.doesNotMatch(block, /actions:/, '全屏蔽用默认 confirm 按钮，不引入自定义动作')
  assert.match(block, /resolve\(false\)/, '转完返回 false 保持打开，不自动关闭，可反复观察屏蔽')
  assert.doesNotMatch(block, /onFailed:/, '保持打开不是失败，不该弹失败提示')

  const exempt = fnBody('openBusyExempt')
  assert.match(exempt, /lockExceptions: \['later'\]/, '单例外按按钮 key 放行')
  assert.equal(
    (exempt.match(/key: '(later|submit)'/g) ?? []).length,
    2,
    '至少两个按钮才能看出「只留一个能点」',
  )
  assert.match(exempt, /key === 'submit'[\s\S]*setTimeout/, '被锁按钮才跑异步，例外按钮可随时中断')

  const catalog = read('demo/src/catalog.ts')
  assert.doesNotMatch(catalog, /id: 'busy-exempt'/, '三档闸门合并在异步一张卡，不再单列')
  assert.match(catalog, /异步 \/ 异步屏蔽 \/ 异步例外/, '目录说明要点出三个按钮')
  // 按钮 loading 的演示文案不能停在旧语义（定宽插圈），否则读者按说明看会与实现相反。
  const actionsDemo = read('demo/src/pages/actions/index.tsx')
  assert.match(actionsDemo, /没图标则文字隐形、整枚转圈/, '按钮演示文案要跟上正交化语义')
  assert.doesNotMatch(actionsDemo, /定宽或 loadingMode=&quot;inline&quot; 在前面插圈/, '旧的分流文案已失效')
})

test('细粒度出口：popup-lock 可从子路径直接命中', () => {
  for (const name of ['index.js', 'index.cjs', 'index.d.ts', 'decide.js', 'decide.d.ts']) {
    assert.ok(existsSync(join(root, 'dist/ui/infra/popup-lock', name)), `缺 dist/ui/infra/popup-lock/${name}`)
  }
  const infra = read('src/ui/infra/index.ts')
  assert.match(infra, /decideGate/, '子域出口也重导出闸门判定')
  const exportsDoc = read('docs/api/exports.md')
  assert.match(exportsDoc, /ui\/infra\/popup-lock/, '出口须登记到 exports.md')
})
