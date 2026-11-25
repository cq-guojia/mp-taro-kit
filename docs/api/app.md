# 应用级接入（`mp-taro-kit/app`）

一条接入解决三件原本要在每个应用入口重复做的事：注入平台能力、装配命令式宿主、装配页面壳。这是唯一 import `@tarojs/taro` 的库出口；主出口 `mp-taro-kit` 保持零平台依赖。宿主按能力显式配置（默认不挂），命令 API 由调用方从精确子入口 import。

## 一条接入

```tsx
// app.tsx
import { createKitApp } from 'mp-taro-kit/app'
import themeConfig from './theme.json'

function App({ children }) { return <>{children}</> }

export default createKitApp(App, {
  theme: { mode: 'auto', themeConfig },
})
```

`createKitApp` 内部依次做：

1. `configure(createTaroFaces(faces), core)` —— 13 个平台方法走 Taro 默认实现，业务用 `faces` 覆盖差异项。
2. `configureSafeArea` —— 取 `getWindowInfo().statusBarHeight` + `getMenuButtonBoundingClientRect()` 注入顶部真值，取 `screenHeight - safeArea.bottom` 注入底部横条真值（Skyline 下 `env()` 取不到）。
3. `setThemeMode(mode, faces)` —— 默认跟随系统，`theme.onDarkChange` 默认用 `themeConfig` 同步窗口背景。
4. 把命令宿主写进注册表；实际渲染由 `KitPage` 在每页页面树中完成。Taro 的 App 根节点不投影成页面可见子树，宿主留在 App 根节点会让命令「有返回但看不见」。

初始化按配置指纹去重：相同配置只做一次；配置变了（改 faces / 主题，或 HMR 重载）整体重放，不静默吞掉新配置。

`KitPage` 依赖的浮动列定位样式随 `KitPage` **自带**：从 `mp-taro-kit/app/kit-page` 或 `mp-taro-kit/app` 引 `KitPage` 即生效，不必单独引 `ui/layout/floating-action/style`。只引 `createKitApp` 不带这份样式。

仍需留在消费方的：`config/index.js` 的插件行、主题样式 import（`styles/theme-runtime`）、`app.json` / `theme.json`。这些是编译期或业务自己的资产，不属于库。

### 参数

| 参数 | 说明 |
|---|---|
| `faces` | 覆盖的 Taro 平台方法；未给的实现走默认 |
| `core` | `baseURL` / `timeout` 等，透传 `configure` |
| `theme.mode` | `light` / `dark` / `auto`，默认 `auto` |
| `theme.themeConfig` | 明暗两套 `bgColor`，用于窗口背景同步 |
| `theme.onDarkChange` | 自定义暗色副作用，覆盖默认的窗口背景同步 |
| `hosts` | 要挂载的命令宿主数组，**默认空**（不挂任何命令宿主）；要哪个就从 `mp-taro-kit/app` import 哪个传进来 |

## 用哪个挂哪个（按能力）

命令式宿主拆成三件，各自只挂需要的那份，且**都从 `mp-taro-kit/app` 导出**：

| 宿主 | 能力 | 遮罩 |
|---|---|---|
| `ToastHost` | `showToast` / `hideToast` / `clearToasts` | 无 |
| `DialogHost` | `alert` / `confirm` | 有（基于 `ContentPopup` 底座，遮罩与锁滚动随浮层） |
| `LoadingHost` | `showLoading` / `hideLoading` | 无 |
| `LoginDialogHost` | 渲染 `setLoginDialog` 注册的业务登录窗 | 由业务 UI 决定 |

四件宿主（含兼容组合 `OverlayHost`）共用 `ui/infra/style` 里的一张 `fixed` 全屏层：容器 `pointer-events: none`，只有真正弹出的子树按类名恢复命中（WXSS 会整条丢弃 `> *` 这类通配符选择器）。拆宿主时必须四件都在这条选择器里，少一件就会出现「命令有返回但屏幕没东西」。宿主样式需宿主应用显式引入 `mp-taro-kit/ui/infra/style`。

宿主由 `KitPage` 从注册表取出、渲染在每页页面树里；不用 `KitPage` 的页面需要自行渲染同一批宿主，否则命令会因宿主未挂载而抛错。`createKitApp` 注入 Taro 页面栈读取器，命令调用时取栈顶页实例的稳定 id；`KitPage` 把本页实例 id 通过上下文传给宿主。Taro 会保留上一页的页面树，`DialogHost` 只认领同 id 的弹窗，避免旧页宿主抢走当前页的对话框，也不受分包 route 前缀影响。手动挂载且不在 `KitPage` 内的宿主只认领没有页面身份的弹窗。

默认一件都不挂。用哪个命令就从 `mp-taro-kit/app` 显式 import 对应宿主，传进 `hosts`：

```tsx
import { createKitApp, ToastHost, DialogHost } from 'mp-taro-kit/app'

export default createKitApp(App, {
  hosts: [ToastHost, DialogHost],  // 只挂 Toast 与 Dialog，不挂 Loading
})
```

`hosts` 控制的是**挂载与能力校验**（没挂就调对应 API 会当场抛错）。**命令 API 另走精确子入口，由调用方在自己文件里 import**：`mp-taro-kit/ui/commands/toast`（`showToast` / `hideToast` / `clearToasts`）、`.../dialog`（`alert` / `confirm`）、`.../loading`（`showLoading` / `hideLoading`）。`mp-taro-kit/ui` 的汇总出口保留作兼容，但会带进全部命令代码，要按需就用子入口。`tests/tree-shaking.test.mjs` 用真实打包探针锁定三入口互不带入。

没挂对应宿主就调对应 API，同步抛带修复指引的 Error，错误点名缺失的宿主并给出准确 import 路径——不会静默失效（老项目用事件总线广播时漏挂就静默无 UI，这个坑不再重演）。

## 页面壳（`KitPage`）

每页包一层，就得到右侧浮动列：默认带回顶按钮，业务按钮从 `actions` 进，不需要的项用 `hideActions` 关。**这是每页一层组件，不是"在 app 里配一次就自动出现在所有页"**——小程序没有跨页共享的 React 树，页面壳必须落在页面上。

```tsx
import { KitPage } from 'mp-taro-kit/app'
import { ScrollView, View } from '@tarojs/components'

function MyPage() {
  return (
    <KitPage actions={[{ id: 'settings', icon: 'common.base:shezhi', onClick: openSettings }]}>
      <ScrollView scrollY>
        <View>页面内容……</View>
      </ScrollView>
    </KitPage>
  )
}
```

**不用写 `id`、不用开 `enhanced`、不用绑 `onScroll`。** 不传 `scrollViewId` 时，`KitPage` 会认领直接 children 里的第一个 `<ScrollView>`（数组会摊平；包在 `<Fragment>` 或自定义组件里的看不到），自动补上：

- `id`：库内部生成；`ScrollView` 自己写了 `id` 就尊重它。
- `enhanced: true`：`ScrollViewContext.scrollTo` 只在增强模式生效，不开则点了没反应。
- `onScroll` 包装：只读地把 `scrollTop` 喂给回顶显隐，同时保留消费方自己写的 `onScroll`。

没找到 `ScrollView`（比如滚动区包在自己的子组件里，或整页没有滚动区）就什么也不做：按钮还在，点了没反应，不报错也不隐藏。这时才需要传 `scrollViewId` 走显式路径，消费方自行保证 id 匹配、`enhanced` 已开、`onScroll` 已绑。

回顶显隐的位置只读喂入，**不回写 `scrollTop` 属性**。回顶走一次节点命令 `scrollTo`，不逐帧、不碰受控状态——逐帧回写是卡顿残影和"过山车"的根源。

`KitPage` 不介入浮层与滚动位置——那是页面结构的事。Taro 把 state 更新归级到 Page 的 `setData`，浮层节点若与滚动容器同级增删，会让原生 `scroll-view` 被重建、`scrollTop` 归零。所以**浮层开合必须与滚动区分处的稳定分支**：滚动区给稳定 `key`，浮层放进一个恒定存在的容器（demo 的 `demo-shell__overlays`），开合只动容器内部。不记坐标、不切 `scroll-y`、不写受控 `scrollTop`（详见 [遮罩与浮层底座](overlay.md)）。

`useKitPageScroll()` 保留给需要自己拿滚动位置的场景（如自定义浮动列）：必须在 `<KitPage>` 内调用，否则当场抛错；取到的是同一个只读回执。主路径不需要调它——`onScroll` 已由 `KitPage` 自动注入。

| prop | 默认 | 说明 |
|---|---|---|
| `backToTop` | `true` | 默认回顶按钮；`backToTop={false}` 是关它的主口径 |
| `scrollViewId` | 不传 | 不传 = 自动认领第一个 ScrollView；传了 = 按 id 查节点的显式路径 |
| `visibilityHeight` | `300` | 回顶按钮显隐阈值 |
| `duration` | `450` | 回顶时长；`0` 走 `animated:false` 瞬间回顶；动画时长仅 iOS 生效（安卓平台限制） |
| `actions` | `[]` | 业务追加的右侧按钮（如设置入口），id 不可为保留字 `backToTop` |
| `hideActions` | `[]` | 按 id 屏蔽业务项；默认回顶用 `backToTop={false}` 关 |
| `position` | `bottom-right` | 浮动列位置档 |

## 业务弹窗注册口

登录窗这类业务弹窗不进核心库。业务在入口注册一次 UI，并把 `LoginDialogHost` 加进 `hosts` 让它能渲染：

```tsx
import { createKitApp, ToastHost, DialogHost, LoginDialogHost, setLoginDialog, requireLogin } from 'mp-taro-kit/app'

setLoginDialog(({ resolve }) => <MyLoginDialog onDone={resolve} />)

export default createKitApp(App, {
  hosts: [ToastHost, DialogHost, LoginDialogHost],
})

// 业务任意位置：未登录时弹窗，登录成功才继续
const ok = await requireLogin()
if (!ok) return
```

库只调度 Promise（同一时刻只挂一个 pending，后来者会先收到 `false`；换组件/注销会兑现旧 pending），UI 与登录实现全归业务。未注册就调 `requireLogin()` 会 reject 并给修复指引——不静默放行，避免未登录继续执行业务。

## 按场景接入示例

下面四例覆盖「新项目怎么接、某页怎么用、某页怎么关、业务弹窗写哪」。只有 `KitPage` 自带浮动列样式；命令宿主与命令 API 都按能力显式 import，不必再引 style。

### 例一：新项目 app 入口（全局只写一次）

```tsx
// app.tsx
import { createKitApp } from 'mp-taro-kit/app'
import themeConfig from './theme.json'
import 'mp-taro-kit/styles/theme-runtime'

function App({ children }) { return <>{children}</> }

export default createKitApp(App, {
  core: { baseURL: 'https://api.example.com' },
  theme: { mode: 'auto', themeConfig },
})
```

这里配的是**全站共用**的东西：平台 faces（不给就用 Taro 默认实现）、core 配置、安全区、主题、命令宿主。以后要加全局能力（比如新命令宿主），改这一处，不用碰任何页面。

### 例二：index 页直接用（默认回顶，什么都不用配）

```tsx
// pages/index/index.tsx
import { ScrollView, View } from '@tarojs/components'
import { KitPage } from 'mp-taro-kit/app'

export default function IndexPage() {
  return (
    <KitPage>
      <ScrollView scrollY>
        <View>首页内容……</View>
      </ScrollView>
    </KitPage>
  )
}
```

只要在 app 入口配过一次，这里包一层 `KitPage`、里面直接放 `<ScrollView>` 就自动有右下回顶；滚过 300px 才出现，点它回顶。不用写 id、不用开 `enhanced`、不用绑 `onScroll`，也不用引样式。

### 例三：某页加自己的浮动按钮 + 关掉默认回顶

```tsx
// pages/settings/index.tsx
import { ScrollView, View } from '@tarojs/components'
import { KitPage } from 'mp-taro-kit/app/kit-page'
import { showToast } from 'mp-taro-kit/ui/commands/toast'

export default function SettingsPage() {
  return (
    <KitPage
      backToTop={false}
      actions={[
        {
          id: 'help',
          icon: 'common.base:bangzhu',
          onClick: () => showToast('帮助中心'),
        },
      ]}
    >
      <ScrollView scrollY>
        <View>设置内容……</View>
      </ScrollView>
    </KitPage>
  )
}
```

`backToTop={false}` 关掉默认回顶；`actions` 加自己的按钮（如帮助入口），id 不能叫保留字 `backToTop`。关掉默认回顶后 `KitPage` 不再注入 `onScroll`，需要滚动位置的自定义列自己用 `useKitPageScroll()` 绑。

### 滚动区包在自定义组件里怎么办

`KitPage` 只认直接 children。如果滚动区藏在你自己的组件内部，它看不到，这时才走显式路径：

```tsx
<KitPage scrollViewId="content-scroll">
  <MyContentShell />{/* 内部有 <ScrollView id="content-scroll" enhanced onScroll={...} /> */}
</KitPage>
```

显式路径下 id、`enhanced`、`onScroll` 都由你负责；传了 `scrollViewId` 就不会触发自动注入。

### 例四：自定义弹窗（登录窗）写哪

业务 UI 和注册放业务代码，不进库：

```tsx
// app.tsx：注册 + 把渲染宿主加进 hosts
import { createKitApp, ToastHost, DialogHost, LoginDialogHost, setLoginDialog } from 'mp-taro-kit/app'
import MyLoginDialog from './components/MyLoginDialog'

setLoginDialog(({ resolve }) => <MyLoginDialog onDone={resolve} />)

export default createKitApp(App, {
  hosts: [ToastHost, DialogHost, LoginDialogHost],
})
```

```tsx
// 任意业务页：需要登录的地方调协议
import { requireLogin } from 'mp-taro-kit/app'

async function submit() {
  if (!(await requireLogin())) return
  // 登录成功后才执行提交
}
```

`MyLoginDialog` 是你的组件（长什么样、怎么登录都归你），只接一个 `resolve(ok)` 回调。库负责调度 Promise：同一时刻只弹一个，换组件/注销会兑现旧请求。

## 更新日志

- 2026-11-20 19:34:39：新建应用级接入文档：createKitApp 一条接入、三件按需宿主、KitPage 页面壳、登录窗注册口
- 2026-11-20 19:44:02：补样式自带契约：KitPage 浮动列定位样式随 app 出口带入，消费方不必单独引
- 2026-11-20 19:54:32：补按场景接入示例：新项目 app 入口、index 页默认用法、某页关回顶加自定义按钮、登录窗写哪
- 2026-11-20：回顶免配置——不传 `scrollViewId` 时自动认领 children 里第一个 ScrollView 并注入 id / enhanced / onScroll；找不到静默无效；显式 id 仍走原路径
- 2026-11-20 20:51:14：澄清自动认领只认直接子节点，Fragment 不摊平
- 2026-11-20 23:25:59：configureSafeArea 注入补底部横条真值 screenHeight - safeArea.bottom
- 2026-11-21：KitPage 提供 ScrollKeeperContext，锁滚动浮层关闭后恢复原滚动位置
- 2026-11-21：移除 ScrollKeeperContext，改订阅全局滚动锁并注入 `scrollY={!locked}`
- 2026-11-22：滚动锁方案实测无效，全部撤销；KitPage 不介入滚动位置，改由页面结构保证（滚动区稳定 key + 浮层恒定隔离容器）
- 2026-11-25 11:12:26：宿主改为按需显式配置：createKitApp 的 hosts 默认空，三件 Host 由调用方显式 import；命令 API 拆 ui/commands/{toast,dialog,loading} 精确子入口；KitPage 浮动列样式下沉到自身并加 app/kit-page 出口；示例同步
- 2026-11-25 11:56:20：DialogHost 改用 ContentPopup 底座
- 2026-11-25 14:48:15：补四件命令宿主共用 fixed 全屏层的契约，说明拆分时漏定位会让命令弹层不进页面视口
- 2026-11-25 14:49:52：补 WXSS 丢弃通配符选择器的限制，命中选择器改按子节点类名逐条列出
- 2026-11-25 14:55:54：命令宿主改由 KitPage 在每页页面树渲染，createKitApp 只登记注册表
- 2026-11-25 15:15:13：命令载荷按发起页 route 归属，避免 Taro 保留的旧页宿主抢走当前页对话框
- 2026-11-25 15:31:08：命令归属改由 app 层注入 Taro 页面栈读取器，载荷记录页面实例 id，不再依赖渲染写入的全局 route
