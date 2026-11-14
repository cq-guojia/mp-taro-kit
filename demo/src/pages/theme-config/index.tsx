import { View, Text } from '@tarojs/components'
import { Card } from 'mp-taro-kit/ui/card'
import { CONTROL_SIZE_DEFAULT } from 'mp-taro-kit/design'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'

import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/cell/style'
import { DemoPage } from '../../components/DemoBlock'

/** 配置里写的是设计基础的名字：色条上写名字，色值只用来决定条上的字是黑还是白。 */
const BASE_ROWS = [
  { token: 'surface-base', name: '页面底色', light: 'f2f3f5', dark: '15181c', lightName: 'gray-2', darkName: 'gray-1' },
  { token: 'surface-1', name: '卡片面', light: 'ffffff', dark: '1f2329', lightName: 'white', darkName: 'gray-2' },
  { token: 'surface-2', name: '次级面', light: 'f7f8fa', dark: '262b32', lightName: 'gray-1', darkName: 'gray-3' },
  { token: 'surface-3', name: '下沉面', light: 'e9ecf1', dark: '2d333b', lightName: 'gray-3', darkName: 'gray-4' },
  { token: 'fg', name: '主要文字', light: '1f2328', dark: 'e6e8eb', lightName: 'ink-1', darkName: 'ink-1' },
  { token: 'fg-2', name: '次要文字', light: '5c6370', dark: 'a9b0ba', lightName: 'ink-2', darkName: 'ink-2' },
  { token: 'fg-3', name: '弱化文字', light: '767d87', dark: '858d98', lightName: 'gray-7', darkName: 'gray-7' },
]

/** 语义色 + 它落在标准色板的哪一支。 */
const COLOR_ROWS = [
  { token: 'business', name: '业务色 business', light: '3b5bdb', dark: '6b8afd', lightName: 'blue', darkName: 'blue' },
  { token: 'success', name: '成功色 success', light: '22c55e', dark: '34d399', lightName: 'green', darkName: 'green' },
  { token: 'warning', name: '警告色 warning', light: 'f59e0b', dark: 'fbbf24', lightName: 'orange', darkName: 'orange' },
  { token: 'danger', name: '错误色 danger', light: 'ec1313', dark: 'ff5c5c', lightName: 'red', darkName: 'red' },
]

/** 只列「不传时有默认值」的项；必须传的一律不列。 */
const DEFAULT_ROWS = [
  { name: '控件尺寸', label: 'Button / Switch / Segmented', value: `${CONTROL_SIZE_DEFAULT}（40px）` },
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

/** 色条上的字按底色亮度取黑或白，只解决可读性，不参与主题。 */
function inkOf(hex: string) {
  const value = parseInt(hex, 16)
  const luma = 0.299 * ((value >> 16) & 255) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)
  return luma > 150 ? 'black' : 'white'
}

/** 明暗两条：色块自身带主题标记，条上写的是设计基础里的名字。 */
function Swatches({
  token,
  light,
  dark,
  lightName,
  darkName,
}: {
  token: string
  light: string
  dark: string
  lightName: string
  darkName: string
}) {
  return (
    <View className="demo-row">
      {[
        { mode: 'light', value: light, label: lightName },
        { mode: 'dark', value: dark, label: darkName },
      ].map((item) => (
        <View
          key={item.mode}
          className={`mptk-${item.mode} demo-swatch demo-swatch--bar demo-swatch--${token}`}
        >
          <Text className={`demo-swatch__ink demo-swatch__ink--${inkOf(item.value)}`}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

export default function ThemeConfigPage() {
  const render = (id: string) => {
    if (id === 'settings') {
      return (
        <View className="demo-cards">
          <Card className="demo-card">
            <CellGroup title="基础配置">
              {BASE_ROWS.map((row) => (
                <Cell
                  key={row.token}
                  title={row.name}
                  value={
                    <Swatches
                      token={row.token}
                      light={row.light}
                      dark={row.dark}
                      lightName={row.lightName}
                      darkName={row.darkName}
                    />
                  }
                />
              ))}
              <Cell
                title="边框"
                value={
                  <View>
                    <Text className="demo-cell-value">rgba(0,0,0,.10)</Text>
                    <Text className="demo-cell-value">rgba(255,255,255,.10)</Text>
                  </View>
                }
              />
            </CellGroup>
          </Card>

          <Card className="demo-card">
            <CellGroup title="颜色配置">
              {COLOR_ROWS.map((row) => (
                <Cell
                  key={row.token}
                  title={row.name}
                  value={
                    <Swatches
                      token={row.token}
                      light={row.light}
                      dark={row.dark}
                      lightName={row.lightName}
                      darkName={row.darkName}
                    />
                  }
                />
              ))}
            </CellGroup>
          </Card>

          <Card className="demo-card">
            <CellGroup title="其他控件配置">
              {DEFAULT_ROWS.map((row) => (
                <Cell key={row.name} title={row.name} label={row.label} value={row.value} />
              ))}
            </CellGroup>
          </Card>
        </View>
      )
    }
    if (id === 'config-file') {
      return (
        <View className="demo-cards">
          <Card className="demo-card" title="配置文件" subtitle="覆盖只写要改的键，没写的继续吃默认值">
            <View className="demo-code">
              {CONFIG_LINES.map((line) => (
                <Text key={line} className="demo-code__line">{line}</Text>
              ))}
            </View>
          </Card>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="theme-config" render={render} />
}
