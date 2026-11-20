import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (file) => readFileSync(join(root, file), 'utf8')

/**
 * demo 站专属设置面板：右侧列常驻入口 + 底部半屏弹窗，含明暗、编译模式、版本三项。
 * 这是 demo 自己的能力，不做成库的演示页。
 */
test('demo 设置面板：每页常驻入口，底部面板按内容撑高，三项齐全', () => {
  const shell = read('demo/src/components/DemoShell.tsx')
  const panel = read('demo/src/components/DemoSettings.tsx')

  // 入口：站级固定 action，不并入页面 actions、不受 hideActions 屏蔽。
  assert.match(shell, /useState\(false\)/, '设置开合状态没在站级管理')
  assert.match(shell, /id: 'demo-settings'/, '缺固定设置入口 id')
  assert.match(shell, /\.\.\.actions,\s*\{ id: 'demo-settings'/, '设置入口没并入每页 actions')
  assert.match(shell, /<DemoSettings open=\{settingsOpen\}/, '设置面板没随每页渲染')

  // 弹窗：底部档 + 默认 panel 档（内容撑高）+ 关闭叉用核心默认外右上。
  assert.match(panel, /position="bottom"/, '不是底部弹出')
  assert.doesNotMatch(panel, /surface="none"/, '普通设置面板不该用裸壳')
  assert.doesNotMatch(panel, /panelStyle/, '不该写死高度，内容多高就多高')
  assert.match(panel, /closeable/, '缺关闭叉')
  assert.doesNotMatch(panel, /closePosition/, '关闭按钮该用核心默认值（外右上），不自己指定')
  assert.match(
    read('src/ui/layout/close-position.ts'),
    /bottom:\s*'above-right'/,
    '核心默认必须是外右上（面板外上方留间距），不是面板内右上',
  )

  // 根因：贴顶/贴底不写死 height，body 统一 View 按内容撑高。
  const sheet = read('src/ui/layout/style/index.scss')
  for (const pos of ['top', 'bottom']) {
    const rule = new RegExp(`\\.mptk-popup__panel--${pos}\\s*\\{([^}]*)\\}`).exec(sheet)?.[1] ?? ''
    assert.doesNotMatch(rule, /height:/, `${pos} 档不该写死 height，内容多高就多高`)
  }
  assert.match(/\.mptk-popup__body\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? '', /flex:\s*0 0 auto/, 'body 该按内容撑高')

  // 规范修复防回归：面板不限高；外置关闭按钮用 transform 相对自身高度定位，不参照面板高度。
  // 否则 Skyline 下 fixed 面板高度参与计算，会把关闭按钮顶到屏幕左上、离面板很远。
  const panelBlock = /\.mptk-popup__panel\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? ''
  assert.doesNotMatch(panelBlock, /max-height\s*:/, '面板不该写 max-height 声明（注释里提到不算）')
  const aboveRight = /\.mptk-popup__close--above-right\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? ''
  assert.match(aboveRight, /transform:\s*translateY\(calc\(var\(--mptk-s-full-neg\) - var\(--mptk-space-3\)\)\)/, '外右上按钮该用 transform 相对自身高度移出面板')
  assert.doesNotMatch(aboveRight, /(?:^|[;{\s])(?:bottom|top):\s*calc\(/, '外置按钮不该再用参照面板高度的 calc 定位')

  // 单组 CellGroup、无标题、无副标题、去上下外框线、分隔线不内缩。
  assert.equal((panel.match(/<CellGroup/g) ?? []).length, 1, '应该只有一组 CellGroup')
  assert.doesNotMatch(panel, /<CellGroup[^>]*\btitle=/, 'CellGroup 不该带标题')
  assert.doesNotMatch(panel, /\blabel=/, '不该写副标题')
  assert.match(panel, /<CellGroup border=\{false\}/, '不要 CellGroup 上下的 border')
  assert.match(panel, /dividerInset=\{false\}/, 'Cell 分隔线不要内缩那种 border')

  // 三项：明暗模式复用 setThemeMode / useThemeSnapshot，编译模式，版本用编译期常量。
  assert.match(panel, /setThemeMode\(next\)/, '明暗模式没接 setThemeMode')
  assert.match(panel, /useThemeSnapshot\(\)/, '明暗模式没读当前主题')
  assert.match(panel, /title="编译模式"/, '缺编译模式项')
  assert.match(panel, /title="当前版本"/, '缺版本项')
  assert.match(panel, /__MTPK_VERSION__/, '版本没用编译期常量')
  assert.match(panel, /__MTPK_BUILD_ID__/, '版本没带编译号')
  assert.equal((panel.match(/<Cell\b/g) ?? []).length, 3, '应该正好三项：明暗 / 编译 / 版本')

  // 每页都挂同一个壳：所有展示页经 DemoPage→DemoShell，入口不落在某个页面里。
  assert.match(read('demo/src/components/DemoBlock.tsx'), /<DemoShell/, 'DemoPage 没走 DemoShell')
})

/** 编译模式如实标注：运行时无切引擎 API，confirm 后只重启，真切换靠 Switch Render / 改配置。 */
test('编译模式：confirm 确认后重启，如实标注引擎切换路径', () => {
  const panel = read('demo/src/components/DemoSettings.tsx')

  assert.match(panel, /import \{ confirm \} from 'mp-taro-kit\/ui'/, '没用库的 confirm')
  assert.match(panel, /confirm\(/, '切换前没弹 confirm')
  assert.match(panel, /\.then\(\(ok\) =>/, 'confirm 的 Promise 结果没被处理')
  assert.match(panel, /if \(!ok\) return/, '取消重启后仍继续执行')
  assert.match(panel, /restartMiniProgram/, '确认后没重启')
  // 真实性：不谎称重启就切了引擎，给出开发版强切入口与配置真源。
  assert.match(panel, /Switch Render/, '没标注开发者工具强切入口')
  assert.match(panel, /app\.config\.ts/, '没标注 renderer 配置真源')
  assert.match(panel, /编译期配置/, '没说清是编译期配置')
  assert.match(panel, /重启只重置运行环境/, '没说清重启不改变引擎')

  // 当前模式取自编译期常量，不是可 setState 假装的运行时状态。
  assert.match(panel, /__MTPK_RENDERER__/, '没读当前编译模式')
  assert.doesNotMatch(panel, /setRenderer|switchRenderer/, '不存在运行时切 renderer 的 API，不能假装调用')
})

/** 产物核对：设置面板与三项文案真进演示站包，中文以 \uXXXX 形式存在。 */
test('演示站产物含设置面板与三项', () => {
  const bundle = read('demo/dist/common.js')
  const esc = (text) => `\\u${[...text].map((c) => c.charCodeAt(0).toString(16).padStart(4, '0')).join('\\u')}`
  for (const label of ['设置', '明暗模式', '编译模式', '当前版本', '重启', 'Switch Render']) {
    assert.ok(bundle.includes(label) || bundle.includes(esc(label)), `产物缺设置项文案：${label}`)
  }
  assert.match(bundle, /demo-settings/, '产物缺设置入口 id')
  assert.match(bundle, /restartMiniProgram/, '产物缺重启调用')
  assert.doesNotMatch(read('demo/dist/app-origin.wxss'), /\.demo-settings\{/, 'panel 档不该再自画底色内边距')
  assert.doesNotMatch(read('demo/dist/app-origin.wxss'), /demo-settings__title/, '旧标题样式应删除')
  assert.equal(existsSync(join(root, 'demo/src/components/DemoSettings.tsx')), true, '缺设置面板源文件')
})
