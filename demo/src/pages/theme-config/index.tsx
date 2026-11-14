import { View, Text } from '@tarojs/components'
import { CONTROL_SIZE_DEFAULT } from 'mp-taro-kit/design'
import { ICON_SIZES } from 'mp-taro-kit/ui/display/icon'

import { DemoPage } from '../../components/DemoBlock'

/** 基础配置：页面与文字的基本取值。 */
const BASE_ROWS = [
  { token: 'surface-base', name: '页面底色', hint: '' },
  { token: 'surface-1', name: '卡片面', hint: '' },
  { token: 'surface-2', name: '次级面', hint: '' },
  { token: 'surface-3', name: '下沉面', hint: '' },
  { token: 'fg', name: '主要文字', hint: '' },
  { token: 'fg-2', name: '次要文字', hint: '' },
  { token: 'fg-3', name: '弱化文字', hint: '' },
  { token: 'border', name: '边框', hint: '' },
]

/** 颜色规范：语义色名 → 标准色相名。 */
const COLOR_ROWS = [
  { token: 'business', name: '业务色 business', hint: 'blue' },
  { token: 'success', name: '成功色 success', hint: 'green' },
  { token: 'warning', name: '警告色 warning', hint: 'orange' },
  { token: 'danger', name: '错误色 danger', hint: 'red' },
]

/** 空间属性：值 + 它属于哪一档。 */
const SPACE_ROWS = [
  { name: '控件圆角', value: '8px', hint: 'sm' },
  { name: '卡片圆角', value: '16px', hint: 'lg' },
  { name: '控件高度', value: '32 / 40 / 48', hint: `默认 ${CONTROL_SIZE_DEFAULT}` },
  { name: '间距', value: '4 / 8 / 12 / 16', hint: 'space-1~4' },
  { name: '字号', value: '12 / 14 / 15 / 17 / 22', hint: 'xs~xl' },
]

/** Icon 规范：不传尺寸时跟随所在文字字号，不取任何档。 */
const ICON_ROWS = [
  { name: '默认字号', value: '跟随文字', hint: '正文 md' },
  {
    name: '尺寸档',
    value: Object.values(ICON_SIZES).join(' / '),
    hint: 'sm~xl',
  },
]

/** 站点覆盖写法：明色落 page、暗色落 .mptk-dark。 */
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

/** 一行色块：左边明色、右边暗色，色块自带主题标记，不额外包容器。 */
function Swatches({ token }: { token: string }) {
  return (
    <View className="demo-settings__value">
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
          <View className="demo-settings">
            <Text className="demo-settings__title">基础配置 · 左明 / 右暗</Text>
            {BASE_ROWS.map((row) => (
              <View key={row.token} className="demo-settings__row">
                <Text className="demo-settings__name">{row.name}</Text>
                <Swatches token={row.token} />
                <Text className="demo-settings__hint">{row.hint}</Text>
              </View>
            ))}
          </View>

          <View className="demo-settings">
            <Text className="demo-settings__title">颜色规范 · 左明 / 右暗</Text>
            {COLOR_ROWS.map((row) => (
              <View key={row.token} className="demo-settings__row">
                <Text className="demo-settings__name">{row.name}</Text>
                <Swatches token={row.token} />
                <Text className="demo-settings__hint">{row.hint}</Text>
              </View>
            ))}
          </View>

          <View className="demo-settings">
            <Text className="demo-settings__title">空间属性</Text>
            {SPACE_ROWS.map((row) => (
              <View key={row.name} className="demo-settings__row">
                <Text className="demo-settings__name">{row.name}</Text>
                <Text className="demo-settings__value demo-settings__value--text">{row.value}</Text>
                <Text className="demo-settings__hint">{row.hint}</Text>
              </View>
            ))}
          </View>

          <View className="demo-settings">
            <Text className="demo-settings__title">Icon 规范</Text>
            {ICON_ROWS.map((row) => (
              <View key={row.name} className="demo-settings__row">
                <Text className="demo-settings__name">{row.name}</Text>
                <Text className="demo-settings__value demo-settings__value--text">{row.value}</Text>
                <Text className="demo-settings__hint">{row.hint}</Text>
              </View>
            ))}
          </View>
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
