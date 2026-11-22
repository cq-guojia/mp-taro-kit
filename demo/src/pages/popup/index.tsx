import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { useThemeSnapshot } from 'mp-taro-kit/ui/infra'
import {
  ImagePopup,
  Popup,
  type ImagePopupSlide,
  type OverlayOpacity,
  type OverlayTone,
  type PopupClosePosition,
  type PopupCloseShape,
  type PopupInsetTop,
  type PopupPosition,
  type PopupRoundSize,
} from 'mp-taro-kit/ui/layout'
import {
  ContentPopup,
  type ContentPopupHeaderTone,
  type ContentPopupPosition,
  type ContentPopupVariant,
} from 'mp-taro-kit/ui/layout/content-popup'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/style'
import 'mp-taro-kit/ui/layout/content-popup/style'
import { DemoPage } from '../../components/DemoBlock'
import { iconMap as demoColorIcons } from '../../icons/mp-taro-kit/demo/color/names'

/* 垂直档：顶部 / 中部 / 底部，横排成一组。 */
const VERTICAL_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'top', label: '顶部' },
  { value: 'center', label: '中部' },
  { value: 'bottom', label: '底部' },
]

/* 侧面档：左侧 / 右侧，按钮尺寸与主控件同档（不传 size 走默认 sm）。 */
const SIDE_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
]

const SHAPES: { value: PopupCloseShape; label: string }[] = [
  { value: 'circle', label: '正圆' },
  { value: 'rounded', label: '圆角方' },
]

const YES_NO = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

/* 背景档：否 = 半透明底色（叉色不变），不等于没有背景。 */
const BG_OPTIONS = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '半透明' },
]

const ROUND_SIZES: { value: PopupRoundSize; label: string }[] = [
  { value: 'none', label: '平' },
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
]

/* 遮罩三档：深色薄（浅）/ 深色标准（深）/ 泛白。 */
type MaskLevel = 'light' | 'dark' | 'pale'
const MASKS: { value: MaskLevel; label: string }[] = [
  { value: 'light', label: '浅' },
  { value: 'dark', label: '深' },
  { value: 'pale', label: '泛白' },
]
const MASK_VALUES: Record<MaskLevel, { tone: OverlayTone; opacity: OverlayOpacity }> = {
  light: { tone: 'dark', opacity: 'thin' },
  dark: { tone: 'dark', opacity: 'default' },
  pale: { tone: 'light', opacity: 'default' },
}

const INSETS: { value: PopupInsetTop; label: string }[] = [
  { value: 'none', label: '不让位' },
  { value: 'status-bar', label: '状态栏' },
  { value: 'nav-bar', label: '导航栏' },
]

type CloseDemoPanel = 'bottom' | 'center' | 'top'

type CloseDemoGroup = {
  panel: CloseDemoPanel
  title: string
  items: { value: PopupClosePosition; label: string }[]
}

/* 关闭按钮位置按弹窗形态并成三组：一行一个形态，行内横排该形态下的代表位置。
   label 口径统一：首字内 / 外，次字左 / 右 / 中，末字上 / 下；跨半档用「跨半」后缀。
   value 才是真实 API 值；底层仍保留其它位置的支持，只是不在这里演示。 */
const CLOSE_GROUPS: CloseDemoGroup[] = [
  {
    panel: 'bottom',
    title: '底部',
    items: [
      { value: 'above-right', label: '外右上' },
      { value: 'above-center', label: '外中上' },
      { value: 'top-right', label: '内右上' },
      { value: 'edge-top-right', label: '右跨半' },
    ],
  },
  {
    panel: 'center',
    title: '中部',
    items: [
      { value: 'below-center', label: '外中下' },
      { value: 'below-right', label: '外右下' },
      { value: 'above-right', label: '外右上' },
      { value: 'edge-top-right', label: '右上跨半' },
    ],
  },
  {
    panel: 'top',
    title: '顶部',
    items: [
      { value: 'below-center', label: '外中下' },
      { value: 'below-right', label: '外右下' },
    ],
  },
]

/* 演示用真实图：
   IMAGE_A / IMAGE_B 是两张常规高度图，用于单图、多图翻页、带按钮与尺寸档；
   LONG_IMAGE 是超长图，只用于「长图滚动」档（不参与单图 / 多图翻页）；
   ACTION_BTN_IMAGE 是图片按钮专用图。 */
const IMAGE_A = 'https://cdn-oss.qswnet.com/file/zuche/wechatminiprogram/user/page-main/image/popup/89483104-2293-4dc2-97bb-341cf9277a1c.png'
const IMAGE_B = 'https://cdn-oss.qswnet.com/file/zuche/wechatminiprogram/user/checkin/image/df61b214-81f1-4e29-98b9-b38957695bb2.png.png'
const LONG_IMAGE = 'https://cdn-oss.qswnet.com/file/zuche/wechatminiprogram/user/content/image/4965/d278336e-af7d-4c83-a423-727495583650.webp'
const ACTION_BTN_IMAGE = 'https://t-cdn-oss.qswnet.com/file/zuche/lottery-center/image/1fc1dcb1-a8f8-444f-941c-d9b5caa12003.png'

/* 第一类「图片」：单图用 A，多图翻页用 A + B（都是正常高度，无长图）。
   每屏给确定宽、不锁高——图片按各自真实比例撑高：矮图框就矮、高图框就高，不压变形。 */
const GALLERY_SLIDES: ImagePopupSlide[] = [
  { src: IMAGE_A, width: 320 },
  { src: IMAGE_B, width: 320 },
]

/* 第二类「带按钮」两种类型，默认居中；两个库按钮顺带演示按钮之间的默认间距。 */
const ACTION_BUTTON_SLIDE: ImagePopupSlide = {
  src: IMAGE_A,
  width: 320,
  actions: [
    { text: '取消', type: 'default', onClick: () => undefined },
    { text: '查看详情', type: 'primary', onClick: () => undefined },
  ],
}
const ACTION_IMAGE_SLIDE: ImagePopupSlide = {
  src: IMAGE_A,
  width: 320,
  actions: [
    { src: ACTION_BTN_IMAGE, height: 36, onClick: () => undefined },
  ],
}

/* 第三类「图片尺寸」三档：定宽 / 定高 / 长图滚动。 */
type ImageSizeMode = 'width' | 'height' | 'scroll'
const SIZE_DEMO: { value: ImageSizeMode; label: string }[] = [
  { value: 'width', label: '定宽' },
  { value: 'height', label: '定高' },
  { value: 'scroll', label: '长图滚动' },
]

/* 关闭位：定宽 / 长图滚动用默认外下中，定高档演示外下右。 */
const SIZE_CLOSE_POSITION: Record<ImageSizeMode, PopupClosePosition> = {
  width: 'below-center',
  height: 'below-right',
  scroll: 'below-center',
}

function sizeDemoSlide(mode: ImageSizeMode): ImagePopupSlide {
  if (mode === 'width') return { src: IMAGE_A, width: 320 }
  if (mode === 'height') return { src: IMAGE_A, height: 240 }
  // 长图：给确定宽让面板贴合图片、滚动条落在图片右缘；视口限高 320px 不变，不顶满屏。
  return { src: LONG_IMAGE, width: 320, maxHeight: 320, fit: 'scroll' }
}

const SAMPLE_LINES = [
  '第 1 行：这次给足长度，能看出面板的真实形态',
  '第 2 行：上下档通栏，左右档是全高抽屉',
  '第 3 行：中间档有默认宽，不再撑满整屏',
  '第 4 行：圆角与遮罩跟随上方配置',
  '第 5 行：关闭按钮用图标库里的叉',
  '第 6 行：位置与关闭按钮位置在下方两块演示',
]

export default function PopupPage() {
  /* 配置区：下面两块演示共用这一套值。 */
  const [closeShape, setCloseShape] = useState<PopupCloseShape>('circle')
  const [closeBorder, setCloseBorder] = useState(true)
  const [closeBackground, setCloseBackground] = useState(true)
  const [roundSize, setRoundSize] = useState<PopupRoundSize>('md')
  const [mask, setMask] = useState<MaskLevel>('dark')
  const [closable, setClosable] = useState(true)
  const [insetTop, setInsetTop] = useState<PopupInsetTop>('nav-bar')

  /* 演示区各自的开合与目标。 */
  const [positionOpen, setPositionOpen] = useState(false)
  const [position, setPosition] = useState<PopupPosition>('bottom')
  const [closeOpen, setCloseOpen] = useState(false)
  const [closePanel, setClosePanel] = useState<CloseDemoPanel>('bottom')
  const [closePosition, setClosePosition] = useState<PopupClosePosition>('above-center')
  const [imageOpen, setImageOpen] = useState(false)
  const [imageMulti, setImageMulti] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [actionKind, setActionKind] = useState<'button' | 'image'>('button')
  const [sizeMode, setSizeMode] = useState<ImageSizeMode>('width')
  const [sizeOpen, setSizeOpen] = useState(false)

  /* 内容弹窗：三档头部各一个 Cell，按钮切形态与位置。 */
  const [contentOpen, setContentOpen] = useState(false)
  const [contentVariant, setContentVariant] = useState<ContentPopupVariant>('title')
  const [contentPosition, setContentPosition] = useState<ContentPopupPosition>('center')
  const [contentMode, setContentMode] = useState<
    'normal' | 'head-light' | 'head-dark' | 'panel-fade' | 'panel-gradient' | 'image-bg' | 'circle' | 'square' | 'left' | 'image' | 'iconclass'
  >('normal')

  const openContent = (variant: ContentPopupVariant, position: ContentPopupPosition, mode: typeof contentMode) => {
    setContentVariant(variant)
    setContentPosition(position)
    setContentMode(mode)
    setContentOpen(true)
  }

  const maskValues = MASK_VALUES[mask]
  const shared = {
    round: roundSize !== 'none',
    roundSize,
    overlayTone: maskValues.tone,
    overlayOpacity: maskValues.opacity,
    closable,
    insetTop,
    closeable: true,
    closeShape,
    closeBorder,
    closeBackground,
  }

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <View>
          <CellGroup title="关闭按钮">
            <Cell
              title="形状"
              value={<Segmented items={SHAPES} value={closeShape} onChange={(next) => setCloseShape(next as PopupCloseShape)} />}
            />
            <Cell
              title="描边"
              value={<Segmented items={YES_NO} value={closeBorder ? 'yes' : 'no'} onChange={(next) => setCloseBorder(next === 'yes')} />}
            />
            <Cell
              title="背景"
              value={<Segmented items={BG_OPTIONS} value={closeBackground ? 'yes' : 'no'} onChange={(next) => setCloseBackground(next === 'yes')} />}
            />
          </CellGroup>
          <CellGroup title="面板">
            <Cell
              title="圆角尺寸"
              value={<Segmented items={ROUND_SIZES} value={roundSize} onChange={(next) => setRoundSize(next as PopupRoundSize)} />}
            />
            <Cell
              title="遮罩"
              value={<Segmented items={MASKS} value={mask} onChange={(next) => setMask(next as MaskLevel)} />}
            />
            <Cell
              title="点遮罩关闭"
              value={<Segmented items={YES_NO} value={closable ? 'yes' : 'no'} onChange={(next) => setClosable(next === 'yes')} />}
            />
            <Cell
              title="让位"
              value={<Segmented items={INSETS} value={insetTop} onChange={(next) => setInsetTop(next as PopupInsetTop)} />}
            />
          </CellGroup>
        </View>
      )
    }
    if (id === 'positions') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="垂直"
              value={
                <View className="demo-row">
                  {VERTICAL_POSITIONS.map((item) => (
                    <Button
                      key={item.value}
                      className="demo-item"
                      size="xs"
                      onClick={() => {
                        setPosition(item.value)
                        setPositionOpen(true)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              }
            />
            <Cell
              title="侧面"
              value={
                <View className="demo-row">
                  {SIDE_POSITIONS.map((item) => (
                    <Button
                      key={item.value}
                      className="demo-item"
                      size="xs"
                      onClick={() => {
                        setPosition(item.value)
                        setPositionOpen(true)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              }
            />
          </CellGroup>
          <Popup
            open={positionOpen}
            position={position}
            onClose={() => setPositionOpen(false)}
            {...shared}
          >
            <Text>{`当前位置：${position} · 圆角 ${roundSize} · 遮罩 ${mask}`}</Text>
            {SAMPLE_LINES.map((line) => (
              <View key={line} className="demo-row">
                <Text>{line}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    if (id === 'close-position') {
      const panelTitle = CLOSE_GROUPS.find((group) => group.panel === closePanel)?.title ?? closePanel
      return (
        <View>
          <CellGroup>
            {CLOSE_GROUPS.map((group) => (
              <Cell
                key={group.panel}
                title={group.title}
                value={
                  <View className="demo-row">
                    {group.items.map((item) => (
                      <Button
                        key={item.value}
                        className="demo-item"
                        size="xs"
                        onClick={() => {
                          setClosePanel(group.panel)
                          setClosePosition(item.value)
                          setCloseOpen(true)
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </View>
                }
              />
            ))}
          </CellGroup>
          <Popup
            open={closeOpen}
            position={closePanel}
            closePosition={closePosition}
            onClose={() => setCloseOpen(false)}
            {...shared}
          >
            <View className="demo-stack">
              <Text>{`${panelTitle}弹窗 / ${closePosition}；形状 ${closeShape} / 描边 ${closeBorder ? '有' : '无'} / 背景 ${closeBackground ? '有' : '半透明'}`}</Text>
              {SAMPLE_LINES.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </View>
          </Popup>
        </View>
      )
    }
    if (id === 'image-popup') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="图片"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => { setImageMulti(false); setImageOpen(true) }}>单图</Button>
                  <Button className="demo-item" size="xs" onClick={() => { setImageMulti(true); setImageOpen(true) }}>多图翻页</Button>
                </View>
              }
            />
            <Cell
              title="带按钮"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => { setActionKind('button'); setActionOpen(true) }}>库按钮</Button>
                  <Button className="demo-item" size="xs" onClick={() => { setActionKind('image'); setActionOpen(true) }}>图片按钮</Button>
                </View>
              }
            />
            <Cell
              title="图片尺寸"
              value={
                <View className="demo-row">
                  {SIZE_DEMO.map((item) => (
                    <Button
                      key={item.value}
                      className="demo-item"
                      size="xs"
                      onClick={() => { setSizeMode(item.value); setSizeOpen(true) }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              }
            />
          </CellGroup>
          <ImagePopup
            open={imageOpen}
            slides={imageMulti ? GALLERY_SLIDES : GALLERY_SLIDES.slice(0, 1)}
            closeable
            closePosition="below-center"
            overlayTone={maskValues.tone}
            overlayOpacity={maskValues.opacity}
            onClose={() => setImageOpen(false)}
          />
          <ImagePopup
            open={actionOpen}
            slides={[actionKind === 'button' ? ACTION_BUTTON_SLIDE : ACTION_IMAGE_SLIDE]}
            closeable
            closePosition="below-center"
            overlayTone={maskValues.tone}
            overlayOpacity={maskValues.opacity}
            onClose={() => setActionOpen(false)}
          />
          <ImagePopup
            open={sizeOpen}
            slides={[sizeDemoSlide(sizeMode)]}
            closeable
            closePosition={SIZE_CLOSE_POSITION[sizeMode]}
            overlayTone={maskValues.tone}
            overlayOpacity={maskValues.opacity}
            onClose={() => setSizeOpen(false)}
          />
        </View>
      )
    }
    if (id === 'content-popup') {
      const { dark } = useThemeSnapshot()
      // 头部底色是固定示例：浅底/深底各一套，字色交给 headerTone 按底色明暗反色，不随主题翻。
      const headerBackground =
        contentMode === 'head-light' ? { from: '#E8F2FF', to: '#BBD7FF' } :
        contentMode === 'head-dark' ? { from: '#1E3A8A', to: '#0F2557' } :
        contentMode === 'image-bg' ? '#fff' :
        undefined
      // 整体渐变铺满整块面板（含头部）：渐隐自顶部即开始平缓淡出，到 45% 已完全回到底色（不再拖到中下部）。
      const panelBackground =
        contentMode === 'panel-fade'
          ? dark
            ? { from: 'rgba(107, 138, 253, .18)', fadeFrom: 0, fadeTo: 45 }
            : { from: 'rgba(59, 91, 219, .10)', fadeFrom: 0, fadeTo: 45 }
          : contentMode === 'panel-gradient'
            ? dark
              ? { from: '#1E3A8A', to: '#0F172A' }
              : { from: '#E8F2FF', to: '#BBD7FF' }
            : undefined
      const headerTone: ContentPopupHeaderTone =
        contentMode === 'head-light' ? 'on-light' :
        contentMode === 'head-dark' ? 'on-dark' :
        // 徽标标题落在透明的 header 区，跟随面板主题即可；容器自身的反色由 badge tone token 处理。
        'normal'
      const badge = contentVariant === 'badge'
        ? {
            size: 72,
            radius: contentMode === 'square' ? 'md' as const : 'circle' as const,
            // 正圆用蓝、圆角方用绿，两个形态各展示一档主题渐变，不必把四色都摆出来。
            tone: contentMode === 'square' ? 'green' as const : 'blue' as const,
            overlap: '40%',
            offset: contentMode === 'left' ? { anchor: 'left' as const, x: 20, y: -8 } : undefined,
            content: contentMode === 'image'
              ? { kind: 'image' as const, src: GALLERY_SLIDES[0].src, width: '100%', height: '100%' }
              : contentMode === 'iconclass'
                ? { kind: 'iconClass' as const, className: demoColorIcons['tool-kit'], size: 32 }
                : { kind: 'icon' as const, name:
                    contentMode === 'circle' ? 'common.base:riqi' :
                    contentMode === 'square' ? 'common.base:shuju' :
                    contentMode === 'left' ? 'common.base:tuichu' :
                    'common.base:AIdamoxing' },
          }
        : undefined
      return (
        <View>
          <CellGroup>
            <Cell
              title="文字头"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'center', 'normal')}>中部</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'bottom', 'normal')}>底部</Button>
                </View>
              }
            />
            <Cell
              title="头部渐变"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'center', 'head-light')}>头部浅</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'center', 'head-dark')}>头部深</Button>
                </View>
              }
            />
            <Cell
              title="整体渐变"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'center', 'panel-fade')}>渐隐</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('title', 'center', 'panel-gradient')}>渐变</Button>
                </View>
              }
            />
            <Cell
              title="图片头"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('image', 'center', 'normal')}>透明</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('image', 'bottom', 'image-bg')}>带背景</Button>
                </View>
              }
            />
            <Cell
              title="外伸icon"
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('badge', 'center', 'circle')}>正圆</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('badge', 'center', 'square')}>圆角方</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('badge', 'bottom', 'left')}>靠左</Button>
                </View>
              }
            />
            <Cell
              value={
                <View className="demo-row">
                  <Button className="demo-item" size="xs" onClick={() => openContent('badge', 'center', 'image')}>图片</Button>
                  <Button className="demo-item" size="xs" onClick={() => openContent('badge', 'center', 'iconclass')}>三方图标</Button>
                </View>
              }
            />
          </CellGroup>
          <ContentPopup
            open={contentOpen}
            variant={contentVariant}
            position={contentPosition}
            closeable
            headerTone={headerTone}
            panelBackground={panelBackground}
            icon={contentVariant === 'title' ? 'common.base:AIdamoxing' : undefined}
            title={contentVariant === 'image' ? undefined : '是否开启相册备份'}
            subtitle={contentVariant === 'title' ? '开启后将自动备份新增的照片与视频' : undefined}
            image={contentVariant === 'image' ? GALLERY_SLIDES[0] : undefined}
            headerBackground={headerBackground}
            badge={badge}
            actions={[{ text: '知道了', onClick: () => setContentOpen(false) }]}
            overlayTone={maskValues.tone}
            overlayOpacity={maskValues.opacity}
            onClose={() => setContentOpen(false)}
          >
            <View className="demo-stack demo-stack--fill">
              <Text>{`内容弹窗 / ${contentVariant} / ${contentPosition}`}</Text>
              <Text>头部、内容与按钮由库组合；完全自绘传 children 与 surface=none</Text>
            </View>
          </ContentPopup>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="popup" render={render} />
}
