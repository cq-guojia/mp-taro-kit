# Toast 轻提示

命令式轻提示，与 Dialog 共用全局命令宿主底座，但独立一份生命周期与状态；不提供声明式 `<Toast>`，业务页面不写组件节点。

## 调用

```ts
import { showToast, hideToast } from 'mp-taro-kit/ui/commands/toast'

const id = showToast({
  title: '保存成功',
  description: '内容已同步到云端',
  tone: 'success',
  closeButton: true,
  action: { key: 'undo', text: '撤销' },
  onAction: (key) => doAction(key),
  duration: 3000,
  position: 'bottom',
  enableStacking: false,
  visibleToasts: 3,
})
hideToast(id)
```

`showToast(string)` 等价于只传 `description`，其余取默认值。`enableStacking` / `visibleToasts` 是**全局配置**（sonner-native 的 Toaster 级 props），显式传就更新全局，之后所有 Toast 都按这份配置显示，不会"先平铺再收成堆叠"；也可直接调用 `setToastConfig({ enableStacking, visibleToasts })` 配置，`getToastConfig()` 读取。

## 载荷约束

载荷只放可序列化 descriptor：`title` / `description` / `tone` / `icon` / `closeButton` / `action` / `position` / `enableStacking` / `visibleToasts` / `duration` / `createdAt` / `expiresAt`。**禁止 ReactNode、`onClick`、Promise resolve 进全局 store**。业务回调只作为 `onAction` 命令层字段，由 Host 按 `phase === 'open' && mountedRef.current && isCurrent(id, seq)` 守卫后调用。

## 跨页语义

- 状态在模块级单例；`expiresAt` 是唯一时间真值，timer 只做及时触发。
- `navigateTo` 后仍在有效期的 Toast 把 scope 交接给新栈顶页，由新页宿主续显剩余时间；同一时刻只有当前页宿主渲染。
- `redirectTo` / `navigateBack` 旧页销毁时只清理该页 owner 的条目，禁止全局 clear。
- 未挂载对应宿主就调用命令会同步抛错，错误点名 `ToastHost`。

## 显示与交互

- 默认平铺，**默认位置为底部**（`position: 'bottom'`，底部往上长）；传 `position: 'top'` 改为顶部往下长。各自计时、各自消失；不做 hover。
- 四种 tone（success / error / warning / info）各用**固定不透明浅底 + 同色描边 + tone 色圆环图标**，卡片有边框有底色；标题与描述保持中性深色、不按 tone 变色（浅底上深色字最清晰）。底色必须是实色——折叠时下层卡片会从上层透出，透明底会渗色。配色 token 在 `kit.config.mjs` 明暗同名同数。
- `enableStacking: true`：折叠成一摞，下层只露 8px 边，并按 sonner-native 的 `scaleX` 横向收窄（每层多收 `2 × 8px / 屏宽`，下限 80%；只改视觉宽度不改布局宽度，避免文字重排）。折叠顺序在所有位置统一「新→旧」：**最新那条最宽、在最上层，往下逐层变窄、藏在后面**；顶部从上方往下叠、底部从下方往上叠只是锚点与 y 符号不同。点任意一条整叠展开为全宽竖排列表，点外部或再点收起。**折叠只是表现形式，点开后按平铺逻辑显示所有条**，不受 `visibleToasts` 限制；展开态全局一份（默认折叠），展开时暂停全部计时、收起时按剩余时间恢复、关闭到剩 1 条自动收起。`visibleToasts` 默认 3，**只在真正堆叠时裁剪**，超出的整条隐藏。
- 移除一条后余项按 600ms easeOutQuart 平滑补位，不瞬移；卡片绝对定位、位置由 `transform` 过渡驱动。卡片高度按真实内容实测（标题 / 描述 / action 按钮高度都算进去），首帧兜底 70px。
- 卡片圆角 `--mptk-radius-md`（12px）、四边内边距 `--mptk-space-3`（12px）；主标题与说明之间 2px。卡面在 tone 实底上叠一层极浅的 45° 斜纹（2px 暗纹 + 2px 明底，明档黑 2% / 暗档白 2%），消解纯色生硬感；整条渐变作为 `--mptk-c-toast-stripe` token 明暗同名同数下发。顶部 / 底部在安全区之外另留 16px（卡片左右边距已降为 12px，两者不等）。
- `action` 是自定义单个操作按钮（`{ key, text, tone? }` + `onAction(key)`），用库 `Button` 的 `xs` 档渲染，与正文间距 8px；`tone` 用与 Dialog 同款字体库图标（勾/叉/警告/信息），外套圆环（24px 圈 / 2px 描边 / 内图标 10px），显式传 `icon` 覆盖。
- 关闭叉默认关闭，显式 `closeButton: true` 开启；触摸滑动关闭为离散阈值实现，Skyline/WebView 双端真机未验证前不宣称与 Reanimated 等价。

## 装配

```tsx
import { createKitApp, ToastHost } from 'mp-taro-kit/app'

export default createKitApp(App, { hosts: [ToastHost] })
```

样式按需引入 `mp-taro-kit/ui/feedback/toast/style` 与 `mp-taro-kit/ui/infra/style`。演示站见 `demo/src/pages/toast/index.tsx`。

## 变更

- 2026-11-26：旧 Toast 全量删除后重建，接入统一全局命令宿主底座；显示交互参照 sonner-native。

## 更新日志

- 2026-11-27 18:02:04：补记 Toast 模块级 store 与每页无状态宿主重构的更新日志
