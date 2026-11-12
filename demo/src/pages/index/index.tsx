import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { setThemeMode, type ThemeMode } from 'mp-taro-kit/runtime'
import { useThemeSnapshot } from 'mp-taro-kit/ui/infra'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'

import 'mp-taro-kit/ui/display/cell/style'
import { menu, pagePathOf } from '../../catalog'
import { DemoShell } from '../../components/DemoShell'
import { DEMO_LOGO_CLASS } from '../../icons/demo-color/class'

// 由 demo/config/index.js 的 defineConstants 在编译期替换。
declare const __MTPK_VERSION__: string
declare const __MTPK_BUILD_ID__: string
declare const __MTPK_RENDERER__: string

const THEME_MODES: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: '明' },
  { id: 'dark', label: '暗' },
  { id: 'auto', label: '跟随系统' },
]

/** 目录页：品牌信息、主题热切换开关，下面按 menu 的固定分组铺单元格。 */
export default function IndexPage() {
  const { mode, dark } = useThemeSnapshot()
  const go = (pageId: string | undefined) => {
    if (pageId === undefined) return
    void Taro.navigateTo({ url: `/${pagePathOf(pageId)}` })
  }

  return (
    <DemoShell title="MP-TARO-KIT" logo home>
      <View className="demo-hero">
        <Text className={`${DEMO_LOGO_CLASS} demo-hero__logo`} />
        <Text className="demo-hero__desc">基于 Taro + React 的小程序基础库</Text>
        <View className="demo-hero__meta">
          <Text className="demo-badge demo-badge--env">{__MTPK_RENDERER__}</Text>
          <Text className="demo-badge">{`v${__MTPK_VERSION__}`}</Text>
          <Text className="demo-badge">{__MTPK_BUILD_ID__}</Text>
        </View>
      </View>
      <View className="demo-block">
        <View className="demo-block__head">
          <Text className="demo-block__title">主题模式</Text>
        </View>
        <View className="demo-row">
          {THEME_MODES.map((item) => (
            <Text
              key={item.id}
              className={`demo-trigger${mode === item.id ? ' demo-trigger--active' : ''}`}
              onClick={() => setThemeMode(item.id)}
            >
              {item.label}
            </Text>
          ))}
        </View>
        <Text className="demo-note">
          {`当前 ${mode} · ${dark ? '暗色生效' : '明色生效'}；切换后全站样式、弹层与窗口背景立即生效，页面不需要改。`}
        </Text>
      </View>
      {menu.map((group) => (
        <CellGroup key={group.id} title={group.title} inset>
          {group.entries.map((entry) =>
            entry.status === 'ready' ? (
              <Cell key={entry.id} title={entry.label} isLink onClick={() => go(entry.pageId)} />
            ) : (
              <Cell key={entry.id} title={entry.label} disabled />
            ),
          )}
        </CellGroup>
      ))}
    </DemoShell>
  )
}
