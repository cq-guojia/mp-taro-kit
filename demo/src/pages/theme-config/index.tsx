import { View, Text } from '@tarojs/components'
import { CONTROL_SIZE_DEFAULT } from 'mp-taro-kit/design'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'

import 'mp-taro-kit/ui/display/cell/style'
import { DemoPage } from '../../components/DemoBlock'

/** 明色值与暗色值都给出来：色块看观感，文字看具体值。 */
const BASE_ROWS = [
  { token: 'surface-base', name: '页面底色', light: '#f2f3f5', dark: '#15181c' },
  { token: 'surface-1', name: '卡片面', light: '#ffffff', dark: '#1f2329' },
  { token: 'surface-2', name: '次级面', light: '#f7f8fa', dark: '#262b32' },
  { token: 'surface-3', name: '下沉面', light: '#e9ecf1', dark: '#2d333b' },
  { token: 'fg', name: '主要文字', light: '#1f2328', dark: '#e6e8eb' },
  { token: 'fg-2', name: '次要文字', light: '#5c6370', dark: '#a9b0ba' },
  { token: 'fg-3', name: '弱化文字', light: '#767d87', dark: '#858d98' },
  { token: 'border', name: '边框', light: 'rgba(0,0,0,.10)', dark: 'rgba(255,255,255,.10)' },
]

/** 语义色 + 它落在标准色板的哪一支。 */
const COLOR_ROWS = [
  { token: 'business', name: '业务色 business', hue: 'blue', light: '#3b5bdb', dark: '#6b8afd' },
  { token: 'success', name: '成功色 success', hue: 'green', light: '#22c55e', dark: '#34d399' },
  { token: 'warning', name: '警告色 warning', hue: 'orange', light: '#f59e0b', dark: '#fbbf24' },
  { token: 'danger', name: '错误色 danger', hue: 'red', light: '#ec1313', dark: '#ff5c5c' },
]

/** 只列「不传时有默认值」的项；必须传的一律不列。 */
const DEFAULT_ROWS = [
  { name: '控件尺寸', label: 'Button / Switch / Segmented', value: `${CONTROL_SIZE_DEFAULT}（48px）` },
  { name: '控件圆角', label: 'Button / Segmented', value: 'sm（8px）' },
  { name: '卡片圆角', label: 'Card', value: 'lg（16px）' },
  { name: '图标字号', label: 'Icon', value: '跟随所在文字' },
]

const CONFIG_LINES = [
  '// demo/src/app-theme.scss',
  'page {',
  '  --mptk-business: var(--mptk-purple);',
  '}',
  '',
  '.mptk-dark {',
  '  --mptk-business: var(--mptk-blue);',
  '}',
]

/** 明暗两色块：色块自身带主题标记，不额外包容器。 */
function Swatches({ token }: { token: string }) {
  return (
    <View className="demo-row">
      <View className={`mptk-light demo-swatch demo-swatch--sm demo-swatch--${token}`} />
      <View className={`mptk-dark demo-swatch demo-swatch--sm demo-swatch--${token}`} />
    </View>
  )
}

export default function ThemeConfigPage() {
  const render = (id: string) => {
    if (id === 'settings') {
      return (
        <View>
          <CellGroup inset title="基础配置">
            {BASE_ROWS.map((row) => (
              <Cell
                key={row.token}
                title={row.name}
                label={`明 ${row.light} · 暗 ${row.dark}`}
                value={<Swatches token={row.token} />}
              />
            ))}
          </CellGroup>

          <CellGroup inset title="颜色规范">
            {COLOR_ROWS.map((row) => (
              <Cell
                key={row.token}
                title={row.name}
                label={`${row.hue} · 明 ${row.light} · 暗 ${row.dark}`}
                value={<Swatches token={row.token} />}
              />
            ))}
          </CellGroup>

          <CellGroup inset title="不传时的默认值">
            {DEFAULT_ROWS.map((row) => (
              <Cell key={row.name} title={row.name} label={row.label} value={row.value} />
            ))}
          </CellGroup>
        </View>
      )
    }
    if (id === 'config-file') {
      return (
        <View>
          <View className="demo-code">
            {CONFIG_LINES.map((line) => (
              <Text key={line} className="demo-code__line">{line}</Text>
            ))}
          </View>
          <Text className="demo-note">覆盖只写要改的键，没写的继续吃默认值。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="theme-config" render={render} />
}
