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
  position: 'top',
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

- 默认平铺：顶部往下长、底部往上长，各自计时、各自消失；不做 hover。
- `enableStacking: true`：折叠成一摞，下层只露 8px 边，点任意一条整叠展开为全宽竖排列表，点外部或再点收起；展开态全局一份（默认折叠），展开时暂停全部计时、收起时按剩余时间恢复、关闭到剩 1 条自动收起。`visibleToasts` 默认 3，**只在堆叠时裁剪**（平铺不限条数），超出的整条隐藏。
- 移除一条后余项按 600ms easeOutQuart 平滑补位，不瞬移；卡片绝对定位、位置由 `transform` 过渡驱动。卡片高度按真实内容实测（标题 / 描述 / action 按钮高度都算进去），首帧兜底 70px。
- 顶部 / 底部在安全区之外另留 16px，与卡片左右边距一致。
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
