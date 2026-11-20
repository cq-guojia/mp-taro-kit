import { useState } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { setThemeMode, type ThemeMode } from 'mp-taro-kit/runtime'
import { useThemeSnapshot } from 'mp-taro-kit/ui/infra'
import { confirm } from 'mp-taro-kit/ui'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { Popup } from 'mp-taro-kit/ui/layout'

import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/style'

// demo/config/index.js 的 defineConstants 在编译期替换。
declare const __MTPK_VERSION__: string
declare const __MTPK_BUILD_ID__: string
declare const __MTPK_RENDERER__: string

const THEME_ITEMS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '明' },
  { value: 'dark', label: '暗' },
  { value: 'auto', label: '跟随系统' },
]

type RendererMode = 'skyline' | 'webview'

const RENDERER_ITEMS: { value: RendererMode; label: string }[] = [
  { value: 'skyline', label: 'Skyline' },
  { value: 'webview', label: 'WebView' },
]

const CURRENT_RENDERER: RendererMode = __MTPK_RENDERER__ === 'WebView' ? 'webview' : 'skyline'

/**
 * 渲染引擎是 app.config.ts 的编译期配置，小程序运行时没有切换 API：
 * 微信只在开发者工具菜单「开发调试 → Switch Render」提供开发版强切。
 * 这里把「选目标 + confirm + 重启」做出来给开发调试用，并如实标注真正生效的路径。
 */
function restartForRenderer(): void {
  const restart = (Taro as unknown as {
    restartMiniProgram?: (option: { path: string }) => void
  }).restartMiniProgram
  if (typeof restart === 'function') {
    restart.call(Taro, { path: 'pages/index/index' })
    return
  }
  const wxRestart = (typeof wx !== 'undefined' ? wx : undefined) as
    | { restartMiniProgram?: (option: { path: string }) => void }
    | undefined
  if (typeof wxRestart?.restartMiniProgram === 'function') {
    wxRestart.restartMiniProgram({ path: 'pages/index/index' })
  }
}

export function DemoSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode } = useThemeSnapshot()
  const [targetRenderer, setTargetRenderer] = useState<RendererMode>(CURRENT_RENDERER)

  const changeRenderer = (next: RendererMode): void => {
    if (next === targetRenderer) return
    void confirm(
      `从 ${CURRENT_RENDERER === 'skyline' ? 'Skyline' : 'WebView'} 切到 ${
        next === 'skyline' ? 'Skyline' : 'WebView'
      } 需要重启小程序；重启只重置运行环境，真正的引擎切换请用开发者工具「开发调试 → Switch Render」或修改 demo/app.config.ts 的 renderer 后重新编译。是否继续重启？`,
      { title: '切换渲染模式', confirmText: '重启', cancelText: '取消' },
    ).then((ok) => {
      if (!ok) return
      setTargetRenderer(next)
      restartForRenderer()
    })
  }

  return (
    <Popup open={open} position="bottom" onClose={onClose} round closeable>
      <View className="demo-settings">
        <CellGroup border={false} dividerInset={false}>
          <Cell
            title="明暗模式"
            value={
              <Segmented items={THEME_ITEMS} value={mode} onChange={(next) => setThemeMode(next)} size="xs" />
            }
          />
          <Cell
            title="编译模式"
            value={
              <Segmented
                items={RENDERER_ITEMS}
                value={targetRenderer}
                onChange={changeRenderer}
                size="xs"
              />
            }
          />
          <Cell title="当前版本" value={`v${__MTPK_VERSION__} · ${__MTPK_BUILD_ID__}`} />
        </CellGroup>
      </View>
    </Popup>
  )
}
