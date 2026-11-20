# 应用级接入（`mp-taro-kit/app`）

一条接入解决三件原本要在每个应用入口重复做的事：注入平台能力、装配命令式宿主、装配页面壳。这是唯一 import `@tarojs/taro` 的库出口；主出口 `mp-taro-kit` 保持零平台依赖。

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
2. `configureSafeArea` —— 取 `getWindowInfo().statusBarHeight` + `getMenuButtonBoundingClientRect()` 注入真值（Skyline 下 `env()` 取不到）。
3. `setThemeMode(mode, faces)` —— 默认跟随系统，`theme.onDarkChange` 默认用 `themeConfig` 同步窗口背景。
4. 渲染 `children` + 命令宿主。

初始化按配置指纹去重：相同配置只做一次；配置变了（改 faces / 主题，或 HMR 重载）整体重放，不静默吞掉新配置。

`KitPage` 依赖的浮动列定位样式由本出口**自带**（`import 'mp-taro-kit/app'` 即生效），消费方不必单独引 `ui/layout/floating-action/style`。

仍需留在消费方的：`config/index.js` 的插件行、主题样式 import（`styles/theme-runtime`）、`app.json` / `theme.json`。这些是编译期或业务自己的资产，不属于库。

### 参数

| 参数 | 说明 |
|---|---|
| `faces` | 覆盖的 Taro 平台方法；未给的实现走默认 |
| `core` | `baseURL` / `timeout` 等，透传 `configure` |
| `theme.mode` | `light` / `dark` / `auto`，默认 `auto` |
| `theme.themeConfig` | 明暗两套 `bgColor`，用于窗口背景同步 |
| `theme.onDarkChange` | 自定义暗色副作用，覆盖默认的窗口背景同步 |
| `hosts` | 命令宿主数组，默认 `[ToastHost, DialogHost, LoadingHost]` |

## 用哪个挂哪个（按能力）

命令式宿主拆成三件，各自只挂需要的那份，且**都从 `mp-taro-kit/app` 导出**：

| 宿主 | 能力 | 遮罩 |
|---|---|---|
| `ToastHost` | `showToast` / `hideToast` / `clearToasts` | 无 |
| `DialogHost` | `alert` / `confirm` | 有（唯一用 `<Overlay>` 的命令宿主，锁滚动） |
| `LoadingHost` | `showLoading` / `hideLoading` | 无 |
| `LoginDialogHost` | 渲染 `setLoginDialog` 注册的业务登录窗 | 由业务 UI 决定 |

默认挂前三件。要按能力收窄，传 `hosts` 覆盖：

```tsx
import { createKitApp, ToastHost, DialogHost } from 'mp-taro-kit/app'

export default createKitApp(App, {
  hosts: [ToastHost, DialogHost],  // 不挂 LoadingHost
})
```

`hosts` 控制的是**挂载与能力校验**（没挂就调对应 API 会当场抛错）。要真正把某能力的代码从包里排除，得靠构建器的 tree-shaking：不在文件里 import 那个组件，它才不会进包——只传参关掉、但仍写在 import 里的组件未必会被移除。

没挂对应宿主就调对应 API，同步抛带修复指引的 Error，错误点名缺失的宿主并给出准确 import 路径——不会静默失效（老项目用事件总线广播时漏挂就静默无 UI，这个坑不再重演）。

## 页面壳（`KitPage`）

每页包一层，就得到右侧浮动列：默认带回顶按钮，业务按钮从 `actions` 进，不需要的项用 `hideActions` 关。**这是每页一层组件，不是"在 app 里配一次就自动出现在所有页"**——小程序没有跨页共享的 React 树，页面壳必须落在页面上。

```tsx
import { KitPage, useKitPageScroll } from 'mp-taro-kit/app'
import { ScrollView } from '@tarojs/components'

function MyPage() {
  const onScroll = useKitPageScroll()
  return (
    <KitPage
      scrollViewId="my-scroll"
      actions={[{ id: 'settings', icon: 'common.base:shezhi', onClick: openSettings }]}
    >
      <ScrollView
        id="my-scroll"
        scrollY
        onScroll={(e) => onScroll(e.detail.scrollTop)}
      >
        ...
      </ScrollView>
    </KitPage>
  )
}
```

`useKitPageScroll()` 必须在 `<KitPage>` 内调用，否则当场抛错。它取到的是只读回执：喂回顶显隐，**不回写 `scrollTop` 属性**。回顶走一次节点命令 `scrollTo`，不逐帧、不碰受控状态——逐帧回写是卡顿残影和"过山车"的根源。

| prop | 默认 | 说明 |
|---|---|---|
| `backToTop` | `true` | 默认回顶按钮；`backToTop={false}` 是关它的主口径 |
| `scrollViewId` | `mptk-page-scroll` | 回顶目标的滚动容器 id |
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

下面四例覆盖「新项目怎么接、某页怎么用、某页怎么关、业务弹窗写哪」。所有 `mp-taro-kit/app` 的 import 都自带样式，不必再引 style。

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
import { KitPage, useKitPageScroll } from 'mp-taro-kit/app'

export default function IndexPage() {
  const onScroll = useKitPageScroll()
  return (
    <KitPage scrollViewId="index-scroll">
      <ScrollView
        id="index-scroll"
        scrollY
        onScroll={(e) => onScroll(e.detail.scrollTop)}
      >
        <View>首页内容……</View>
      </ScrollView>
    </KitPage>
  )
}
```

只要在 app 入口配过一次，这里包一层 `KitPage` 就自动有右下回顶；滚过 300px 才出现，点它回顶。这一页没加任何业务按钮，也不用引样式。

### 例三：某页加自己的浮动按钮 + 关掉默认回顶

```tsx
// pages/settings/index.tsx
import { ScrollView, View } from '@tarojs/components'
import { KitPage, useKitPageScroll } from 'mp-taro-kit/app'
import { showToast } from 'mp-taro-kit/ui'

export default function SettingsPage() {
  const onScroll = useKitPageScroll()
  return (
    <KitPage
      scrollViewId="settings-scroll"
      backToTop={false}
      actions={[
        {
          id: 'help',
          icon: 'common.base:bangzhu',
          onClick: () => showToast('帮助中心'),
        },
      ]}
    >
      <ScrollView id="settings-scroll" scrollY onScroll={(e) => onScroll(e.detail.scrollTop)}>
        <View>设置内容……</View>
      </ScrollView>
    </KitPage>
  )
}
```

`backToTop={false}` 关掉默认回顶；`actions` 加自己的按钮（如帮助入口）。id 是业务自己起的，不能叫保留字 `backToTop`。

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
