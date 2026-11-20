# 自动回顶按钮

## 接口 / 导出

`mp-taro-kit/ui/layout/floating-action`：`BackToTop`、`useBackToTop`、`scrollViewToTop`、`BackToTopProps`、`UseBackToTopOptions`
`mp-taro-kit/ui/layout`：同上（子域出口）

回顶拆成三块，各管一件事：

- `BackToTop`：`FloatingAction` 的外观特化（默认回顶图标），只收离散 `visible` + `onClick`，不碰滚动。
- `useBackToTop`：只判断「是否越过阈值」，滚动位置存 ref，只在布尔翻转时 setState；阈值变化立即用最后位置重算。
- `scrollViewToTop`：一次节点命令回顶，滚动由视图层原生完成。

库不 import Taro、不查节点、**不碰 scrollTop 属性**、不接管容器。必须放进 `FloatingActionGroup` 当 children。

### 参数 / 输入

`BackToTopProps` 即 `FloatingActionProps`（`ButtonProps` + `visible` / `duration` / `translucent`），无新增字段；`icon` 默认 `common.base:huidingbu`，可覆盖。这里的 `duration` 是壳的显隐进出场时长（motion token），**不是回顶滚动时长**。

`useBackToTop({ visibilityHeight })`：

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `visibilityHeight` | number | 否 | ≥ 0，默认 `300` | `scrollTop >= 该值` 时 visible=true；给 `0` 即恒显 |

返回 `{ visible: boolean, onScroll: (top: number) => void }`。`onScroll` 收 `e.detail.scrollTop` 数值。

`scrollViewToTop(node, duration)`：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `node` | `{ scrollTo?(o) } \| null \| undefined` | 是 | `ScrollViewContext` 节点，消费方用 `createSelectorQuery().select('#id').node()` 取 |
| `duration` | number | 否 | 回顶动画时长，默认 450；`<= 0` 为瞬间回顶（关动画）；平台限制见下 |

### 返回 / 输出

组件无返回值。`useBackToTop` 只在阈值翻转时 setState。`scrollViewToTop` 发一次滚动命令：`duration <= 0` 时 `scrollTo({ top: 0, animated: false })`（瞬间、跨端一致），否则 `scrollTo({ top: 0, animated: true, duration })`。

### 示例

```tsx
import { useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { ScrollView, View } from '@tarojs/components'
import { FloatingActionGroup, BackToTop, useBackToTop, scrollViewToTop } from 'mp-taro-kit/ui/layout'
import 'mp-taro-kit/ui/layout/floating-action/style'

const SCROLL_ID = 'page-scroll'

export default function Page() {
  const [duration, setDuration] = useState(450)
  const nodeRef = useRef<Parameters<typeof scrollViewToTop>[0]>(null)
  const { visible, onScroll } = useBackToTop({ visibilityHeight: 300 })

  const handleBack = () => {
    const emit = (node: typeof nodeRef.current) => scrollViewToTop(node, duration)
    if (nodeRef.current) return emit(nodeRef.current)
    Taro.createSelectorQuery().select(`#${SCROLL_ID}`).node().exec((res) => {
      const node = res?.[0]?.node as typeof nodeRef.current
      if (node) { nodeRef.current = node; emit(node) }
    })
  }

  return (
    <View className="page">
      <ScrollView
        id={SCROLL_ID}
        scrollY type="custom" enhanced
        onScroll={(e) => onScroll(e.detail.scrollTop)}
      >
        {/* 长内容 */}
      </ScrollView>
      <FloatingActionGroup position="bottom-right">
        <BackToTop visible={visible} onClick={handleBack} />
      </FloatingActionGroup>
    </View>
  )
}
```

**铁律**：滚动位置绝不绑到 scroll-view 的 `scrollTop` 属性。回顶走节点命令，点一次发一次，不逐帧、不碰受控属性。节点只查一次缓存复用。

### 行为契约

- **显隐**：`scrollTop >= visibilityHeight` 翻转时 visible 才变；阈值本身变化时也立即用最后位置重算。显隐走 `FloatingAction` 的 `usePresence`（300ms 淡入淡出，motion token）。
- **回顶**：点一次发一次命令，视图层原生滚动，无逐帧、无回弹、无残影。`duration <= 0` 走 `animated: false`（瞬间、跨端一致）；否则走 `animated: true` + duration。
- **平台限制（时长）**：动画档的 `duration` 仅 iOS 生效；安卓 WebView 自 2022-12-01 起废弃 duration 与 velocity，安卓的 450/900 都走平台默认时长。这是微信的平台行为，JS 侧在「一次命令」下无法跨端统一。但**瞬间档靠 `animated: false` 跨端有效**——安卓/开发者工具上唯一能区分的就是「瞬间 vs 有动画」。
- **不接管容器**：库不 import Taro、不查节点；滚动位置只读喂入，程序化回顶由消费方取节点并调用 `scrollViewToTop`。
- **多实例**：回到顶部是全局语义，一个页面只挂一个 `BackToTop`。
- **不做派生判断**：区间显隐、"滚到底"由消费方自己算，库只保留单一阈值。

### 为什么旧 API 被废弃

- **逐帧 `scrollTop` + `onScrollTopChange`**（第一版）：消费方把滚动位置做成受控 state，每帧 setData 且受控属性把视图往回钉 → 卡顿与残影。
- **逐帧 setState 绑 `driveTop` 到 `scrollTop`**（第三版）：动画结束从受控置回 undefined，视图层弹回旧位置 → 回顶过山车。
- **逐帧发节点 `scrollTo` 命令**（第四版）：每帧一条命令让视图层不断重启滚动、目标每帧变化追不上 → 回顶来回蹦。

三版都在诱导错误或不稳定写法，故整体废弃，换成「离散阈值 + 一次节点命令」的当前契约。**教训：回顶动画必须交给视图层一次完成，JS 逐帧驱动（无论改 state 还是发命令）在小程序上都不稳定。**

### 相关

- `docs/api/app.md` 的 `KitPage`：应用级免配置入口——不传 `scrollViewId` 时自动认领 children 里第一个 ScrollView 并注入 id / enhanced / onScroll，多数页面不必手写本节示例里的取节点与绑回执代码。本节是底层三块的手写用法，供自定义场景使用。
- `docs/api/floating-action.md`：壳的两层拆分、位置档、受控显隐与条件触发分工。
- `docs/dependencies/skyline-rendering.md`：Skyline 下滚动由 scroll-view 承担。

## 更新日志

- 2026-11-20：四修定稿。废弃 JS 逐帧方案（改 state 会回弹过山车、发命令会来回蹦），改为一次 `scrollTo` 命令交给视图层；保留阈值变化立即重算；文档写清四版废弃原因与平台 duration 限制。
- 2026-11-20：修瞬间档——`duration <= 0` 改传 `animated: false`，此前 `animated:true + duration:0` 在安卓被当无效值、照播默认动画。
- 2026-11-20：相关链接补应用级入口 `KitPage` 自动认领 ScrollView，底层三块契约不变。
