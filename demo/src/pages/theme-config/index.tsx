import { View, Text } from '@tarojs/components'
import { Card } from 'mp-taro-kit/ui/card'
import { CONTROL_SIZE_DEFAULT } from 'mp-taro-kit/design'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'

import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/cell/style'
import { DemoPage } from '../../components/DemoBlock'
import { KIT_CONFIG_ROWS } from '../../kit-config.generated'

/** 只列名字与色板项名；色值一律从生成表读，页面不复制任何取值。 */
const BASE_ROWS = [
  { token: 'surface-base', name: '页面底色', lightName: 'gray-2', darkName: 'gray-1' },
  { token: 'surface-1', name: '卡片面', lightName: 'white', darkName: 'gray-2' },
  { token: 'surface-2', name: '次级面', lightName: 'gray-1', darkName: 'gray-3' },
  { token: 'surface-3', name: '下沉面', lightName: 'gray-3', darkName: 'gray-4' },
  { token: 'fg', name: '主要文字', lightName: 'ink-1', darkName: 'ink-1' },
  { token: 'fg-2', name: '次要文字', lightName: 'ink-2', darkName: 'ink-2' },
  { token: 'fg-3', name: '弱化文字', lightName: 'gray-7', darkName: 'gray-7' },
]

/** 语义色 + 它落在标准色板的哪一支。 */
const COLOR_ROWS = [
  { token: 'business', name: '业务色', note: 'business', lightName: 'blue', darkName: 'blue' },
  { token: 'success', name: '成功色', note: 'success', lightName: 'green', darkName: 'green' },
  { token: 'warning', name: '警告色', note: 'warning', lightName: 'orange', darkName: 'orange' },
  { token: 'danger', name: '错误色', note: 'danger', lightName: 'red', darkName: 'red' },
]

/** 从生成表按「分组 + CSS 变量名」取当前生效值。 */
function configValue(group: string, token: string) {
  return KIT_CONFIG_ROWS.find((row) => row.group === group && row.key === `--mptk-${token}`)?.value ?? ''
}

/** 只列「不传时有默认值」的项；必须传的一律不列。 */
const DEFAULT_ROWS = [
  { name: '控件尺寸', label: 'Button / Switch / Segmented', value: `${CONTROL_SIZE_DEFAULT}（${configValue('base', 'control-h-md')}）` },
  { name: '控件圆角', label: 'Button / Segmented', value: `sm（${configValue('base', 'radius-sm')}）` },
  { name: '卡片圆角', label: 'Card', value: `md（${configValue('base', 'radius-md')}）` },
  { name: '图标字号', label: 'Icon', value: '跟随所在文字' },
]

const groups: Record<string, { label: string; count: number }> = {}
for (const row of KIT_CONFIG_ROWS) {
  const entry = groups[row.group] ?? { label: row.groupLabel, count: 0 }
  entry.count += 1
  groups[row.group] = entry
}
const GROUP_STATS = Object.values(groups)

/** 差异文件示例也由生成表拼出，不写死任何键或值。 */
const SAMPLE = KIT_CONFIG_ROWS.find((row) => row.group === 'light' && row.value.startsWith('#')) ?? KIT_CONFIG_ROWS[0]
const CONFIG_LINES = [
  '// kit.config.mjs（项目根，只写与库默认不同的键）',
  'export default {',
  `  ${SAMPLE.group}: {`,
  `    "${SAMPLE.key}": "${SAMPLE.value}",`,
  '  },',
  '}',
]

/** 色条上的字按底色亮度取黑或白，只解决可读性，不参与主题。 */
function inkOf(raw: string) {
  let hex = raw.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('')
  const value = parseInt(hex, 16)
  if (Number.isNaN(value)) return 'white'
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
          <Card className="demo-card" title="基础配置">
            <CellGroup>
              {BASE_ROWS.map((row) => (
                <Cell
                  key={row.token}
                  title={row.name}
                  value={
                    <Swatches
                      token={row.token}
                      light={configValue('light', row.token)}
                      dark={configValue('dark', row.token)}
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
                    <Text className="demo-cell-value">{configValue('light', 'border')}</Text>
                    <Text className="demo-cell-value">{configValue('dark', 'border')}</Text>
                  </View>
                }
              />
            </CellGroup>
          </Card>

          <Card className="demo-card" title="颜色配置">
            <CellGroup>
              {COLOR_ROWS.map((row) => (
                <Cell
                  key={row.token}
                  title={
                    <Text>
                      {row.name}
                      <Text className="demo-cell-title-note"> {row.note}</Text>
                    </Text>
                  }
                  value={
                    <Swatches
                      token={row.token}
                      light={configValue('light', row.token)}
                      dark={configValue('dark', row.token)}
                      lightName={row.lightName}
                      darkName={row.darkName}
                    />
                  }
                />
              ))}
            </CellGroup>
          </Card>

          <Card className="demo-card" title="其他控件配置">
            <CellGroup>
              {DEFAULT_ROWS.map((row) => (
                <Cell key={row.name} title={row.name} label={row.label} value={row.value} />
              ))}
              {GROUP_STATS.map((group) => (
                <Cell key={group.label} title={group.label} value={`${String(group.count)} 项可配`} />
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
              {CONFIG_LINES.map((line, index) => (
                <Text key={`${String(index)}-${line}`} className="demo-code__line">{line}</Text>
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
