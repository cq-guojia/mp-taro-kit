import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (file) => readFileSync(join(root, file), 'utf8')

/** app 出口是 Taro-aware 的唯一装配点；主出口不许静态 import Taro。 */
test('mp-taro-kit/app 出口存在，主出口仍不 import Taro', () => {
  assert.equal(existsSync(join(root, 'dist/app/index.js')), true, 'dist/app/index.js 不存在')
  assert.match(read('src/app/index.ts'), /createKitApp/)
  assert.match(read('src/app/index.ts'), /KitPage/)
  assert.match(read('src/app/index.ts'), /setLoginDialog/)
  assert.doesNotMatch(read('src/index.ts'), /@tarojs\/taro/, '主出口不许 import Taro')
  assert.match(read('src/app/create-kit-app.tsx'), /from '@tarojs\/taro'/, 'app 出口必须自己 import Taro')
  assert.match(read('package.json'), /"\.\/app"/, 'package.json 缺 ./app 出口')
})

/** KitPage 依赖的浮动列定位样式必须随 app 出口自带，消费方不能漏引。 */
test('app 出口自带浮动列样式，任何消费方 import 即有 fixed 定位', () => {
  const src = read('src/app/index.ts')
  assert.match(src, /import ['"]\.\.\/ui\/layout\/floating-action\/style\/index\.css['"]/, 'app 出口没带浮动列样式')
  const built = read('dist/app/index.js')
  assert.match(built, /floating-action\/style\/index\.css/, 'dist/app/index.js 丢了样式 import')
  assert.equal(existsSync(join(root, 'dist/ui/layout/floating-action/style/index.css')), true, 'dist 缺浮动列 css')
  assert.doesNotMatch(read('dist/app/index.d.ts'), /\.css/, '声明文件不该残留 css import')
  // demo 是消费方：全局 wxss 必须有规则，而不是只在某一个页面里。
  const globalCss = read('demo/dist/common.wxss')
  assert.match(globalCss, /\.mptk-fab-group--bottom-right/, '全局样式缺浮动列定位规则')
})

/** 三件命令宿主按能力拆开：遮罩只进 DialogHost。 */
test('toast / dialog / loading 三件宿主独立，遮罩只属于 DialogHost', () => {
  for (const name of ['ToastHost', 'DialogHost', 'LoadingHost']) {
    assert.equal(existsSync(join(root, `src/ui/infra/${name}.tsx`)), true, `缺 ${name}.tsx`)
    assert.match(read(`src/ui/infra/index.ts`), new RegExp(`export \\{ ${name}`), `${name} 没导出`)
  }
  assert.match(read('src/ui/infra/DialogHost.tsx'), /<Overlay\s+closable=\{false\}/, 'Dialog 没挂遮罩')
  assert.doesNotMatch(read('src/ui/infra/ToastHost.tsx'), /<Overlay\b/, 'Toast 带了遮罩')
  assert.doesNotMatch(read('src/ui/infra/LoadingHost.tsx'), /<Overlay\b/, 'Loading 带了遮罩')
  // OverlayHost 是兼容组合，自身不许再出现遮罩实现。
  assert.doesNotMatch(read('src/ui/infra/OverlayHost.tsx'), /<Overlay\b/, '兼容层不该重复实现遮罩')
  assert.match(read('src/ui/infra/OverlayHost.tsx'), /<ToastHost/, '兼容层没组合 ToastHost')
  assert.match(read('src/ui/infra/OverlayHost.tsx'), /<DialogHost/, '兼容层没组合 DialogHost')
  assert.match(read('src/ui/infra/OverlayHost.tsx'), /<LoadingHost/, '兼容层没组合 LoadingHost')
})

/** 按能力判定挂载：没挂 ToastHost 就调 showToast 必须当场抛，且错误信息点名对应 Host。 */
test('命令式 API 按能力校验宿主，互不牵连', async () => {
  const ui = { ...await import(join(root, 'dist/ui/index.js')) }
  const { markHostMounted, markHostUnmounted, isHostMounted } = ui

  for (const kind of ['toast', 'dialog', 'loading']) {
    markHostUnmounted(kind)
    assert.equal(isHostMounted(kind), false, `${kind} 初始不该挂载`)
  }

  // 只挂 toast：toast 可用，dialog / loading 仍抛。
  markHostMounted('toast')
  assert.equal(isHostMounted('toast'), true)
  const before = []
  for (const call of [() => ui.alert('x'), () => ui.showLoading()]) {
    try { call() } catch (error) { before.push(String(error.message)) }
  }
  assert.equal(before.length, 2, '没挂 dialog/loading 时调用必须抛错')
  assert.match(before[0], /DialogHost/, 'dialog 错误信息没点名 DialogHost')
  assert.match(before[1], /LoadingHost/, 'loading 错误信息没点名 LoadingHost')
  const toastId = ui.showToast('ok')
  assert.equal(typeof toastId, 'number', '挂了 ToastHost 却不能 showToast')
  ui.hideToast(toastId)

  // 兼容 API：markOverlayHostMounted 一次挂三件，卸载也一次清三件。
  ui.markOverlayHostMounted()
  assert.equal(ui.isOverlayHostMounted(), true)
  ui.markOverlayHostUnmounted()
  assert.equal(ui.isOverlayHostMounted(), false)
  ui.resetUIForTests()
})

/** createKitApp 配置指纹 guard：相同配置不重放，配置变了整体重配（兼容 HMR / 多实例）。 */
test('createKitApp 配置指纹 guard 与按需宿主', () => {
  const src = read('src/app/create-kit-app.tsx')
  assert.match(src, /fingerprint/, '缺配置指纹 guard')
  assert.match(src, /state\.fingerprint !== fingerprint/, 'configure 不在 guard 内')
  assert.match(src, /configure\(createTaroFaces/, '没把 Taro faces 注入 core')
  assert.match(src, /configureSafeArea\(/, '没注入安全区真值')
  assert.match(src, /bottomInset/, '没注入底部横条真值')
  assert.match(src, /screenHeight - safeArea\.bottom/, '底部横条没按屏幕高减安全区底边算')
  assert.match(src, /safeArea && typeof windowInfo\.screenHeight/, 'safeArea / screenHeight 缺失时没兜底')
  assert.match(src, /setThemeMode\(/, '没注入主题')
  assert.match(src, /options\.hosts \?\? \[ToastHost, DialogHost, LoadingHost\]/, '默认宿主不是三件全给')
  assert.match(src, /hosts\.map\(/, '没按 hosts 数组渲染宿主')
})

/** KitPage：每页包一层的页面壳，默认回顶可关、业务项可加，不碰受控 scrollTop。 */
test('KitPage 默认回顶可关可加，滚动回执只读不回写', () => {
  const src = read('src/app/KitPage.tsx')
  assert.match(src, /<BackToTop/, 'KitPage 没默认挂回顶')
  assert.match(src, /hideActions/, '缺屏蔽开关')
  assert.match(src, /actions\?:/, '缺业务追加项')
  assert.match(src, /createContext/, '缺滚动回执 context')
  assert.match(src, /useBackToTop/, '回顶显隐没接 hook')
  assert.doesNotMatch(src, /scrollTop=/, 'KitPage 不许回写受控 scrollTop')
  assert.doesNotMatch(src, /onScrollTopChange/, 'KitPage 不许用逐帧驱动回调')
})

/**
 * 回顶自动认领：不传 scrollViewId 时扫直接 children 的第一个 ScrollView 注入能力，
 * 找不到静默无效；传了 id 走原路径。注入逻辑是零平台依赖纯函数，产物必须存在。
 */
test('回顶自动认领第一个 ScrollView，找不到静默无效，显式 id 仍走原路径', () => {
  const kit = read('src/app/KitPage.tsx')
  const inject = read('src/app/scroll-inject.ts')

  // KitPage：默认 id 不再写死，两条路径分流。
  assert.doesNotMatch(kit, /scrollViewId\s*=\s*'mptk-page-scroll'/, '默认 id 写死会盖掉自动认领')
  assert.match(kit, /scrollViewId === undefined\s*\?\s*injectFirstScrollView/, '没传 id 没走自动认领')
  assert.match(kit, /scrollViewId \?\? auto\?\.id \?\? null/, '目标 id 没接住自动认领结果')
  assert.match(kit, /if \(targetId === null\) return/, '找不到滚动区时回顶没静默返回')
  assert.match(kit, /cached\.id === targetId/, '节点缓存没按 id 失效')

  // 纯函数：只认直接子节点、尊重已有 id、强制 enhanced、包装 onScroll。
  assert.match(inject, /Children\.map/, '没扫直接 children')
  assert.match(inject, /child\.type !== scrollViewType && child\.type !== 'scroll-view'/, '两端 ScrollView 没都识别')
  assert.match(inject, /props\.id \?\? injection\.id/, '没尊重消费方自己写的 id')
  assert.match(inject, /enhanced: true/, '没强制开增强模式（ScrollViewContext 才生效）')
  assert.match(inject, /injection\.onScroll\(event\.detail\.scrollTop\)/, '没把滚动位置喂给回执')
  assert.match(inject, /props\.onScroll\?\.\(event\)/, '吞掉了消费方自己的 onScroll')

  // 产物齐全：纯函数必须真进 dist，否则 app 出口运行时报错。
  assert.equal(existsSync(join(root, 'dist/app/scroll-inject.js')), true, 'dist 缺 scroll-inject.js')
  assert.match(read('dist/app/scroll-inject.js'), /cloneElement/, 'dist 注入逻辑丢了 cloneElement')
})

/** 登录窗真行为：未注册 reject、注册后 resolve、替换组件兑现旧 pending、无 Taro/React 依赖。 */
test('登录窗协议真行为', async () => {
  const src = read('src/app/login-dialog.ts')
  assert.doesNotMatch(src, /@tarojs\/taro/, '登录窗协议不许依赖 Taro')
  assert.doesNotMatch(src, /from 'react'/, '登录窗协议不许依赖 React')

  const login = await import(join(root, 'dist/app/login-dialog.js'))

  // 未注册即 reject。
  await assert.rejects(() => login.requireLogin(), /未注册登录窗/)

  // 注册后 resolve(true) 兑现，重复 resolve 无副作用。
  login.setLoginDialog(() => null)
  const first = login.requireLogin()
  login.resolveLogin(true)
  assert.equal(await first, true)
  login.resolveLogin(false) // 无 pending，不该影响后续

  // 替换组件先把旧 pending 兑现成 false，不永久挂起。
  login.setLoginDialog(() => null)
  const pending = login.requireLogin()
  login.setLoginDialog(() => null)
  assert.equal(await pending, false)

  // 注销后再次调用又走 reject。
  login.setLoginDialog(null)
  await assert.rejects(() => login.requireLogin(), /未注册登录窗/)
})

/** 登录窗渲染宿主：注册的 UI 必须被真正渲染，resolve 接库协议。 */
test('登录窗有渲染宿主，注册 UI 不再无处挂', () => {
  assert.equal(existsSync(join(root, 'dist/app/LoginDialogHost.js')), true, '缺 LoginDialogHost 产物')
  const host = read('src/app/LoginDialogHost.tsx')
  assert.match(host, /useSyncExternalStore/, '宿主没订阅注册变化')
  assert.match(host, /resolve/, '宿主没把 resolve 接给业务 UI')
  assert.match(read('src/app/index.ts'), /LoginDialogHost/, 'app 出口没导出登录宿主')
})

/** demo 入口一条接入，且所有 demo 页都经 KitPage 得到右侧列。 */
test('demo 一条接入 + 页面壳统一走 KitPage', () => {
  const app = read('demo/src/app.tsx')
  assert.match(app, /createKitApp\(/, 'demo 入口没用 createKitApp')
  assert.doesNotMatch(app, /configureSafeArea\(/, 'demo 不该再手写安全区')
  assert.doesNotMatch(app, /configure\(faces\)/, 'demo 不该再手写 faces')
  const shell = read('demo/src/components/DemoShell.tsx')
  assert.match(shell, /<KitPage/, 'DemoShell 没用 KitPage')
  assert.doesNotMatch(shell, /useKitPageScroll/, 'DemoShell 主路径不该手写滚动回执（KitPage 自动注入）')
  // ScrollView 是 KitPage 直接子节点才能被认领；主路径不写死 id / enhanced。
  assert.match(shell, /<KitPage[^>]*>[\s\S]*?<DemoNav[\s\S]*?<ScrollView/, 'ScrollView 不是 KitPage 直接子节点')
  assert.match(shell, /enhanced=\{scrollViewId !== undefined\}/, '主路径还自己写了 enhanced')
})
