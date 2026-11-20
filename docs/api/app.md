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
import { createKitApp, LoginDialogHost, setLoginDialog, requireLogin } from 'mp-taro-kit/app'

setLoginDialog(({ resolve }) => <MyLoginDialog onDone={resolve} />)

export default createKitApp(App, {
  hosts: [ToastHost, DialogHost, LoginDialogHost],
})

// 业务任意位置：未登录时弹窗，登录成功才继续
const ok = await requireLogin()
if (!ok) return
```

库只调度 Promise（同一时刻只挂一个 pending，后来者会先收到 `false`；换组件/注销会兑现旧 pending），UI 与登录实现全归业务。未注册就调 `requireLogin()` 会 reject 并给修复指引——不静默放行，避免未登录继续执行业务。

## 更新日志

- 2026-11-20 19:34:39：新建应用级接入文档：createKitApp 一条接入、三件按需宿主、KitPage 页面壳、登录窗注册口
- 2026-11-20 19:44:02：补样式自带契约：KitPage 浮动列定位样式随 app 出口带入，消费方不必单独引
