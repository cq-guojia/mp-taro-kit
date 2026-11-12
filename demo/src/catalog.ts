export type CatalogExample = {
  id: string
  title: string
  hint: string
  usage: string
  imports: string[]
  renderNotes: string
}

export type CatalogPage = {
  id: string
  title: string
  path: string
  summary: string
  /** 整页示例不套演示卡片，直接铺在页面底色上（通栏类组件用）。 */
  bare?: boolean
  examples: CatalogExample[]
}

/** ready 可点并跳 pageId；planned 只占位、灰显、不绑跳转。 */
export type EntryStatus = 'ready' | 'planned'

export type MenuEntry = {
  id: string
  /** 菜单一行显示的文字，形如「Button 按钮」。 */
  label: string
  status: EntryStatus
  /** ready 必填，必须是 pages 里存在的页 id。 */
  pageId?: string
}

export type MenuGroup = {
  id: string
  title: string
  entries: MenuEntry[]
}

// 展示页真源：一页对应一个库侧子域（或一组能力域）；基础规范组下设计基础与尺寸各成一页。
// 路由由 pages 派生；usage 与 renderNotes 由演示站维护方填写，此处只搭结构。
// 预留 id：skeleton（骨架屏归属 feedback / display 未定，不生成页面）。
export const pages: CatalogPage[] = [
  {
    id: 'design-foundation',
    title: '设计基础',
    path: 'pages/design-foundation/index',
    summary: '颜色：8 级中性灰阶、8 支色相与明暗两套取值',
    examples: [
      {
        id: 'neutral-grays',
        title: '中性灰阶',
        hint: '编号表示层级，1 是最底层、8 是最上层文字；明暗两套方向相反',
        usage: '',
        imports: ['mp-taro-kit/styles/theme-runtime'],
        renderNotes: '色块只读 var(--mptk-gray-*)，不复制色值',
      },
      {
        id: 'hues',
        title: '色相与明暗',
        hint: '8 支色相 × 4 档：本色 / 悬停 / 按下 / 浅底；切首页主题对照明暗两套',
        usage: '',
        imports: ['mp-taro-kit/styles/theme-runtime'],
        renderNotes: '派生值落成具体色值，不依赖运行时混色',
      },
    ],
  },
  {
    id: 'sizing',
    title: '尺寸',
    path: 'pages/sizing/index',
    summary: '控件高度三档与字号、间距、圆角、动效的档位体系',
    examples: [
      {
        id: 'control-height',
        title: '控件高度',
        hint: '32 / 40 / 48 三档，对齐 WeUI 按钮高度，默认 48',
        usage: '',
        imports: ['mp-taro-kit/styles/theme-runtime'],
        renderNotes: '标尺吃 --mptk-control-h-*；Switch / Segmented 逐档吃同名 token，效果见表单页',
      },
      {
        id: 'scale',
        title: '其余档位',
        hint: '字号 / 行高、间距、圆角、动效都在样式基线里，不随明暗变化',
        usage: '',
        imports: ['mp-taro-kit/styles/theme-runtime'],
        renderNotes: '档位数值由文档与自检核对，本页不另立一套',
      },
    ],
  },
  {
    id: 'infra',
    title: '基础设施',
    path: 'pages/infra/index',
    summary: '挂载基座、安全区与跨副本状态',
    examples: [
      {
        id: 'overlay-host',
        title: '挂载点',
        hint: 'OverlayHost：页面基座挂一次',
        usage: '',
        imports: ['mp-taro-kit/ui/infra', 'mp-taro-kit/ui/infra/style'],
        renderNotes: '',
      },
      {
        id: 'safe-area',
        title: '安全区',
        hint: 'SafeArea',
        usage: '',
        imports: ['mp-taro-kit/ui/infra', 'mp-taro-kit/ui/infra/style'],
        renderNotes: '',
      },
      {
        id: 'use-store',
        title: '状态订阅',
        hint: 'useOverlayEntries / useNotices / useLoadingState：订阅全局单例',
        usage: '',
        imports: ['mp-taro-kit/ui/infra'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'icon',
    title: '图标',
    path: 'pages/icon/index',
    summary: '字体图标：按名取类名，单色可随 color 改色',
    examples: [
      {
        id: 'icon-grid',
        title: '图标清单',
        hint: '清单由 mp-taro-kit/ui/icon 的 iconNames 驱动',
        usage: '<Text className={iconClass("zujian")} />',
        imports: ['mp-taro-kit/ui/icon', 'mp-taro-kit/ui/icon/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'actions',
    title: '动作',
    path: 'pages/actions/index',
    summary: '触发动作的控件',
    examples: [
      {
        id: 'button-basic',
        title: '基础按钮',
        hint: 'Button',
        usage: '',
        imports: ['mp-taro-kit/ui/actions', 'mp-taro-kit/ui/actions/style'],
        renderNotes: '',
      },
      {
        id: 'button-state',
        title: '按钮状态',
        hint: 'Button：禁用 / 加载 / 危险',
        usage: '',
        imports: ['mp-taro-kit/ui/actions', 'mp-taro-kit/ui/actions/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'form',
    title: '表单',
    path: 'pages/form/index',
    summary: '开关与分段选择：两种形状、两种指示器、三档尺寸与异步回弹',
    examples: [
      {
        id: 'switch-basic',
        title: '开关',
        hint: 'Switch：圆形 / 圆角方，两侧可放文字或图标，三档尺寸',
        usage: '<Switch checked={on} onChange={(next) => setOn(next)} />',
        imports: ['mp-taro-kit/ui/form/switch', 'mp-taro-kit/ui/form/switch/style'],
        renderNotes: '根框高度吃 --mptk-control-h-*，轨道比行高小并垂直居中；Skyline / WebView 双端实机未验证',
      },
      {
        id: 'switch-state',
        title: '开关状态',
        hint: '禁用 / 外部转圈 / 先拨过去再转圈 / 失败回弹',
        usage: '<Switch checked={on} onChange={(next) => save(next).then(() => setOn(next))} onFailed={rollback} />',
        imports: ['mp-taro-kit/ui/form/switch', 'mp-taro-kit/ui/form/switch/style'],
        renderNotes: '失败示例由宿主在 onFailed 里回滚自己的值；转圈是纯 CSS，不依赖图标包',
      },
      {
        id: 'segmented-basic',
        title: '分段选择',
        hint: 'Segmented：滑动块指示器，可带图标 / 计数 / 副文本 / 段级禁用',
        usage: '<Segmented items={items} value={value} onChange={setValue} />',
        imports: ['mp-taro-kit/ui/form/segmented', 'mp-taro-kit/ui/form/segmented/style'],
        renderNotes: '段等分，滑动块位置由组件按段数算百分比，不读 DOM 尺寸；双端实机未验证',
      },
      {
        id: 'segmented-line',
        title: '频道切换',
        hint: 'indicator="line"：下划线指示器',
        usage: '<Segmented items={channels} value={channel} indicator="line" onChange={setChannel} />',
        imports: ['mp-taro-kit/ui/form/segmented', 'mp-taro-kit/ui/form/segmented/style'],
        renderNotes: '与滑动块共用同一档高度；横滑未纳入本版，双端实机未验证',
      },
      {
        id: 'segmented-state',
        title: '选择状态',
        hint: '等待后台时先选中并转圈，成功保持',
        usage: '<Segmented items={items} value={value} onChange={(next) => save(next).then(() => setValue(next))} />',
        imports: ['mp-taro-kit/ui/form/segmented', 'mp-taro-kit/ui/form/segmented/style'],
        renderNotes: '与 Switch 共用同一套异步切换状态机',
      },
      {
        id: 'control-colors',
        title: '颜色',
        hint: '默认蓝；内置蓝 / 绿 / 橙 / 红；也可直接传色值',
        usage: '<Switch checked color="green" /> 或 <Switch checked color="#8b5cf6" />',
        imports: ['mp-taro-kit/ui/form/switch', 'mp-taro-kit/ui/form/segmented'],
        renderNotes: '主色取自控件主色轴，不跟宿主业务色走；自定义色值用显式内联上色，双端实机未验证',
      },
    ],
  },
  {
    id: 'feedback',
    title: '反馈',
    path: 'pages/feedback/index',
    summary: '反馈类声明式组件',
    examples: [
      {
        id: 'toast',
        title: '轻提示',
        hint: 'Toast',
        usage: '',
        imports: ['mp-taro-kit/ui/feedback', 'mp-taro-kit/ui/feedback/style'],
        renderNotes: '',
      },
      {
        id: 'dialog',
        title: '对话框',
        hint: 'Dialog',
        usage: '',
        imports: ['mp-taro-kit/ui/feedback', 'mp-taro-kit/ui/feedback/style'],
        renderNotes: '',
      },
      {
        id: 'loading',
        title: '加载中',
        hint: 'Loading',
        usage: '',
        imports: ['mp-taro-kit/ui/feedback', 'mp-taro-kit/ui/feedback/style'],
        renderNotes: '',
      },
      {
        id: 'loader',
        title: '加载图标',
        hint: 'Loader：自绘双色缺角环 / blocks 三块脉动，五档尺寸 xs~xl；切首页主题看明暗两套',
        usage: '<Loader variant="blocks" size="xl" />',
        imports: ['mp-taro-kit/ui/feedback', 'mp-taro-kit/ui/feedback/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'display',
    title: '展示',
    path: 'pages/display/index',
    summary: '展示类声明式组件',
    bare: true,
    examples: [
      {
        id: 'cell-basic',
        title: '基础用法（通栏）',
        hint: 'CellGroup 默认左右通到底；组内最后一格自动不画分隔线',
        usage: '<CellGroup><Cell title="单元格" value="内容" /><Cell title="单元格" value="内容" label="描述信息" /></CellGroup>',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '通栏由 mptk-cell-group--flush 派生，外框是独立 1px 元素；Skyline / WebView 双端实机未验证',
      },
      {
        id: 'cell-inset',
        title: '卡片风格',
        hint: 'CellGroup inset：圆角内收，微信「我的」那种一块块',
        usage: '<CellGroup inset><Cell title="单元格" value="内容" /><Cell title="单元格" value="内容" label="描述信息" /></CellGroup>',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '圆角落在 Group 的 body 上，卡片形态不画上下外框；双端实机未验证',
      },
      {
        id: 'cell-size',
        title: '单元格大小',
        hint: 'size="large" 加大上下留白；默认 normal',
        usage: '<Cell title="单元格" value="内容" size="large" label="描述信息" />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '',
      },
      {
        id: 'cell-icon',
        title: '展示图标',
        hint: 'icon 是内容位（ReactNode），图标类名由宿主给',
        usage: '<Cell title="单元格" icon={<Text className={iconClass("home")} />} />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style', 'mp-taro-kit/ui/icon'],
        renderNotes: '图标字体样式由宿主在 app 入口引基础包提供，Cell 样式不含字体声明',
      },
      {
        id: 'cell-link',
        title: '展示箭头',
        hint: 'isLink 纯视觉；arrowDirection 支持 right / left / up / down',
        usage: '<Cell title="单元格" isLink arrowDirection="down" />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '箭头由两条边框 + transform: rotate 画出，不依赖图标包；Skyline 下 rotate 待实机验证',
      },
      {
        id: 'cell-navigate',
        title: '点击跳转',
        hint: '替代 Vant 的 url / link-type：路由能力经 onClick 由宿主注入',
        usage: '<Cell title="单元格" isLink onClick={() => Taro.navigateTo({ url: "/pages/actions/index" })} />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '本库不 import Taro；跳转、返回等行为全部由宿主回调决定',
      },
      {
        id: 'cell-group-title',
        title: '分组标题',
        hint: 'CellGroup title 可给任意内容，多个分组叠放',
        usage: '<CellGroup title="分组 1"><Cell title="单元格" value="内容" /></CellGroup>',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '',
      },
      {
        id: 'cell-slot',
        title: '使用插槽',
        hint: 'title / value(children) / icon / rightIcon / extra 全是 ReactNode',
        usage: '<Cell value="内容" title={<View>…<Badge count="标签" /></View>} isLink />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style', 'mp-taro-kit/ui/display'],
        renderNotes: 'value 给定时优先于 children；rightIcon 给定时不再渲染 isLink 箭头',
      },
      {
        id: 'cell-center',
        title: '垂直居中',
        hint: 'center 让左右内容整体垂直居中，适合有 label 的长单元格',
        usage: '<Cell center title="单元格" value="内容" label="描述信息" />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '',
      },
      {
        id: 'cell-state',
        title: '点击态与禁用',
        hint: 'onClick 派生按压反馈（不暴露 clickable）；disabled 短路回调',
        usage: '<Cell title="单元格" isLink onClick={handleClick} /><Cell title="禁用" disabled onClick={handleClick} />',
        imports: ['mp-taro-kit/ui/display/cell', 'mp-taro-kit/ui/display/cell/style'],
        renderNotes: '按压反馈用 Taro View 的 hoverClass，两端都有；双端实机未验证',
      },
      {
        id: 'badge',
        title: '徽标',
        hint: 'Badge',
        usage: '',
        imports: ['mp-taro-kit/ui/display', 'mp-taro-kit/ui/display/style'],
        renderNotes: '',
      },
      {
        id: 'divider',
        title: '分割线',
        hint: 'Divider',
        usage: '',
        imports: ['mp-taro-kit/ui/display', 'mp-taro-kit/ui/display/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'navigation',
    title: '导航',
    path: 'pages/navigation/index',
    summary: '导航类容器',
    examples: [
      {
        id: 'navbar',
        title: '导航栏',
        hint: 'NavBar：状态栏高度与胶囊几何由调用方注入',
        usage: '',
        imports: ['mp-taro-kit/ui/navigation', 'mp-taro-kit/ui/navigation/style'],
        renderNotes: '',
      },
      {
        id: 'drawer',
        title: '抽屉',
        hint: 'Drawer',
        usage: '',
        imports: ['mp-taro-kit/ui/navigation', 'mp-taro-kit/ui/navigation/style'],
        renderNotes: '',
      },
      {
        id: 'dropdown',
        title: '下拉菜单',
        hint: 'Dropdown',
        usage: '',
        imports: ['mp-taro-kit/ui/navigation', 'mp-taro-kit/ui/navigation/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'layout',
    title: '布局容器',
    path: 'pages/layout/index',
    summary: '遮罩、覆盖层与弹出层',
    examples: [
      {
        id: 'mask',
        title: '遮罩',
        hint: 'Mask',
        usage: '',
        imports: ['mp-taro-kit/ui/layout', 'mp-taro-kit/ui/layout/style'],
        renderNotes: '',
      },
      {
        id: 'overlay',
        title: '覆盖层',
        hint: 'Overlay',
        usage: '',
        imports: ['mp-taro-kit/ui/layout', 'mp-taro-kit/ui/layout/style'],
        renderNotes: '',
      },
      {
        id: 'popup',
        title: '弹出层',
        hint: 'Popup',
        usage: '',
        imports: ['mp-taro-kit/ui/layout', 'mp-taro-kit/ui/layout/style'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'foundation',
    title: '基础能力',
    path: 'pages/foundation/index',
    summary: '四域合并：换肤、单例、工具与平台注入',
    examples: [
      {
        id: 'tokens',
        title: '样式变量换肤',
        hint: 'styles/theme-* 三选一：固定明 / 固定暗 / 跟随系统',
        usage: '',
        imports: ['mp-taro-kit/styles/theme-auto', 'mp-taro-kit/design'],
        renderNotes: '',
      },
      {
        id: 'core-configure',
        title: '平台能力注入',
        hint: 'core.configure(faces)',
        usage: '',
        imports: ['mp-taro-kit/core'],
        renderNotes: '',
      },
      {
        id: 'utils',
        title: '通用工具',
        hint: 'date / string / number / path / i18n',
        usage: '',
        imports: ['mp-taro-kit/utils'],
        renderNotes: '',
      },
      {
        id: 'runtime',
        title: '运行时状态',
        hint: '跨副本单例与覆盖层栈',
        usage: '',
        imports: ['mp-taro-kit/runtime'],
        renderNotes: '',
      },
    ],
  },
  {
    id: 'commands',
    title: '命令式 API',
    path: 'pages/commands/index',
    summary: '无需 JSX 的调用，返回 Promise',
    examples: [
      {
        id: 'toast-command',
        title: '轻提示',
        hint: 'showToast / hideToast / clearToasts',
        usage: '',
        imports: ['mp-taro-kit/ui', 'mp-taro-kit/ui/infra'],
        renderNotes: '',
      },
      {
        id: 'alert',
        title: '提示',
        hint: 'alert：解析即关',
        usage: '',
        imports: ['mp-taro-kit/ui', 'mp-taro-kit/ui/infra'],
        renderNotes: '',
      },
      {
        id: 'confirm',
        title: '确认',
        hint: 'confirm：resolve 布尔值',
        usage: '',
        imports: ['mp-taro-kit/ui', 'mp-taro-kit/ui/infra'],
        renderNotes: '',
      },
      {
        id: 'loading-command',
        title: '加载句柄',
        hint: 'showLoading / hideLoading',
        usage: '',
        imports: ['mp-taro-kit/ui', 'mp-taro-kit/ui/infra'],
        renderNotes: '',
      },
    ],
  },
]

// 菜单真源：首组是基础规范（Foundations），中间六组对齐 Vant Weapp 的公共分类，
// 后两组收纳本库独有的非 UI 能力。顺序固定：新增组件只把 planned 翻成 ready，不插队、不重排。
// planned 不是待办清单，只占住位置，避免以后加内容时整段重排。
export const menu: MenuGroup[] = [
  {
    id: 'foundations',
    title: '基础规范',
    entries: [
      { id: 'design-foundation', label: '设计基础', status: 'ready', pageId: 'design-foundation' },
      { id: 'sizing', label: '尺寸', status: 'ready', pageId: 'sizing' },
      { id: 'icons-spec', label: '图标规范', status: 'planned' },
      { id: 'elevation', label: '层级', status: 'planned' },
      { id: 'motion', label: '动效', status: 'planned' },
    ],
  },
  {
    id: 'base',
    title: '基础组件',
    entries: [
      { id: 'button', label: 'Button 按钮', status: 'ready', pageId: 'actions' },
      { id: 'cell', label: 'Cell 单元格', status: 'ready', pageId: 'display' },
      { id: 'config-provider', label: 'ConfigProvider 全局配置', status: 'ready', pageId: 'foundation' },
      { id: 'icon', label: 'Icon 图标', status: 'ready', pageId: 'icon' },
      { id: 'image', label: 'Image 图片', status: 'planned' },
      { id: 'layout', label: 'Layout 布局', status: 'planned' },
      { id: 'popup', label: 'Popup 弹出层', status: 'ready', pageId: 'layout' },
      { id: 'space', label: 'Space 间距', status: 'planned' },
      { id: 'style', label: 'Style 内置样式', status: 'ready', pageId: 'foundation' },
      { id: 'toast', label: 'Toast 轻提示', status: 'ready', pageId: 'feedback' },
      { id: 'overlay-host', label: 'OverlayHost 挂载点', status: 'ready', pageId: 'infra' },
      { id: 'safe-area', label: 'SafeArea 安全区', status: 'ready', pageId: 'infra' },
    ],
  },
  {
    id: 'form',
    title: '表单组件',
    entries: [
      { id: 'calendar', label: 'Calendar 日历', status: 'planned' },
      { id: 'cascader', label: 'Cascader 级联选择', status: 'planned' },
      { id: 'checkbox', label: 'Checkbox 复选框', status: 'planned' },
      { id: 'date-picker', label: 'DatePicker 日期选择', status: 'planned' },
      { id: 'field', label: 'Field 输入框', status: 'planned' },
      { id: 'form', label: 'Form 表单', status: 'planned' },
      { id: 'number-keyboard', label: 'NumberKeyboard 数字键盘', status: 'planned' },
      { id: 'password-input', label: 'PasswordInput 密码输入框', status: 'planned' },
      { id: 'picker', label: 'Picker 选择器', status: 'planned' },
      { id: 'picker-group', label: 'PickerGroup 选择器组', status: 'planned' },
      { id: 'radio', label: 'Radio 单选框', status: 'planned' },
      { id: 'rate', label: 'Rate 评分', status: 'planned' },
      { id: 'search', label: 'Search 搜索', status: 'planned' },
      { id: 'slider', label: 'Slider 滑块', status: 'planned' },
      { id: 'signature', label: 'Signature 签名', status: 'planned' },
      { id: 'stepper', label: 'Stepper 步进器', status: 'planned' },
      { id: 'switch', label: 'Switch 开关', status: 'ready', pageId: 'form' },
      { id: 'time-picker', label: 'TimePicker 时间选择', status: 'planned' },
      { id: 'uploader', label: 'Uploader 文件上传', status: 'planned' },
      { id: 'segmented', label: 'Segmented 分段选择', status: 'ready', pageId: 'form' },
    ],
  },
  {
    id: 'feedback',
    title: '反馈组件',
    entries: [
      { id: 'action-sheet', label: 'ActionSheet 动作面板', status: 'planned' },
      { id: 'barrage', label: 'Barrage 弹幕', status: 'planned' },
      { id: 'dialog', label: 'Dialog 弹出框', status: 'ready', pageId: 'feedback' },
      { id: 'dropdown-menu', label: 'DropdownMenu 下拉菜单', status: 'ready', pageId: 'navigation' },
      { id: 'floating-panel', label: 'FloatingPanel 浮动面板', status: 'planned' },
      { id: 'floating-bubble', label: 'FloatingBubble 浮动气泡', status: 'planned' },
      { id: 'loading', label: 'Loading 加载', status: 'ready', pageId: 'feedback' },
      { id: 'notify', label: 'Notify 消息通知', status: 'planned' },
      { id: 'overlay', label: 'Overlay 遮罩层', status: 'ready', pageId: 'layout' },
      { id: 'pull-refresh', label: 'PullRefresh 下拉刷新', status: 'planned' },
      { id: 'share-sheet', label: 'ShareSheet 分享面板', status: 'planned' },
      { id: 'swipe-cell', label: 'SwipeCell 滑动单元格', status: 'planned' },
      { id: 'loader', label: 'Loader 加载图标', status: 'ready', pageId: 'feedback' },
      { id: 'drawer', label: 'Drawer 抽屉', status: 'ready', pageId: 'navigation' },
    ],
  },
  {
    id: 'display',
    title: '展示组件',
    entries: [
      { id: 'badge', label: 'Badge 徽标', status: 'ready', pageId: 'display' },
      { id: 'circle', label: 'Circle 环形进度条', status: 'planned' },
      { id: 'collapse', label: 'Collapse 折叠面板', status: 'planned' },
      { id: 'count-down', label: 'CountDown 倒计时', status: 'planned' },
      { id: 'divider', label: 'Divider 分割线', status: 'ready', pageId: 'display' },
      { id: 'empty', label: 'Empty 空状态', status: 'planned' },
      { id: 'highlight', label: 'Highlight 高亮文本', status: 'planned' },
      { id: 'image-preview', label: 'ImagePreview 图片预览', status: 'planned' },
      { id: 'lazyload', label: 'Lazyload 懒加载', status: 'planned' },
      { id: 'list', label: 'List 列表', status: 'planned' },
      { id: 'notice-bar', label: 'NoticeBar 通知栏', status: 'planned' },
      { id: 'popover', label: 'Popover 气泡弹出框', status: 'planned' },
      { id: 'progress', label: 'Progress 进度条', status: 'planned' },
      { id: 'rolling-text', label: 'RollingText 翻滚文本', status: 'planned' },
      { id: 'skeleton', label: 'Skeleton 骨架屏', status: 'planned' },
      { id: 'steps', label: 'Steps 步骤条', status: 'planned' },
      { id: 'sticky', label: 'Sticky 粘性布局', status: 'planned' },
      { id: 'swipe', label: 'Swipe 轮播', status: 'planned' },
      { id: 'tag', label: 'Tag 标签', status: 'planned' },
      { id: 'text-ellipsis', label: 'TextEllipsis 文本省略', status: 'planned' },
      { id: 'watermark', label: 'Watermark 水印', status: 'planned' },
    ],
  },
  {
    id: 'navigation',
    title: '导航组件',
    entries: [
      { id: 'action-bar', label: 'ActionBar 动作栏', status: 'planned' },
      { id: 'back-top', label: 'BackTop 回到顶部', status: 'planned' },
      { id: 'grid', label: 'Grid 宫格', status: 'planned' },
      { id: 'index-bar', label: 'IndexBar 索引栏', status: 'planned' },
      { id: 'navbar', label: 'NavBar 导航栏', status: 'ready', pageId: 'navigation' },
      { id: 'pagination', label: 'Pagination 分页', status: 'planned' },
      { id: 'sidebar', label: 'Sidebar 侧边导航', status: 'planned' },
      { id: 'tab', label: 'Tab 标签页', status: 'planned' },
      { id: 'tabbar', label: 'Tabbar 标签栏', status: 'planned' },
      { id: 'tree-select', label: 'TreeSelect 分类选择', status: 'planned' },
    ],
  },
  {
    id: 'business',
    title: '业务组件',
    entries: [
      { id: 'address-edit', label: 'AddressEdit 地址编辑', status: 'planned' },
      { id: 'address-list', label: 'AddressList 地址列表', status: 'planned' },
      { id: 'area', label: 'Area 省市区选择', status: 'planned' },
      { id: 'card', label: 'Card 商品卡片', status: 'planned' },
      { id: 'contact-card', label: 'ContactCard 联系人卡片', status: 'planned' },
      { id: 'contact-edit', label: 'ContactEdit 联系人编辑', status: 'planned' },
      { id: 'contact-list', label: 'ContactList 联系人列表', status: 'planned' },
      { id: 'coupon', label: 'Coupon 优惠券', status: 'planned' },
      { id: 'submit-bar', label: 'SubmitBar 提交订单栏', status: 'planned' },
    ],
  },
  {
    id: 'capability',
    title: '基础能力',
    entries: [
      { id: 'export-map', label: '汇总出口与按需 import', status: 'ready', pageId: 'foundation' },
      { id: 'platform-inject', label: '平台能力注入', status: 'ready', pageId: 'foundation' },
      { id: 'http', label: '网络请求', status: 'ready', pageId: 'foundation' },
      { id: 'router', label: '路由操作', status: 'ready', pageId: 'foundation' },
      { id: 'storage', label: '本地存储', status: 'ready', pageId: 'foundation' },
      { id: 'wechat', label: '微信能力', status: 'ready', pageId: 'foundation' },
      { id: 'runtime-tools', label: '运行时工具', status: 'ready', pageId: 'foundation' },
      { id: 'utils', label: '通用工具', status: 'ready', pageId: 'foundation' },
      { id: 'state-subscribe', label: '状态订阅', status: 'ready', pageId: 'infra' },
      { id: 'design-tokens', label: '设计令牌', status: 'ready', pageId: 'foundation' },
    ],
  },
  {
    id: 'commands',
    title: '命令式 API',
    entries: [
      { id: 'command-toast', label: '轻提示', status: 'ready', pageId: 'commands' },
      { id: 'command-loading', label: '加载句柄', status: 'ready', pageId: 'commands' },
      { id: 'command-alert', label: '提示框', status: 'ready', pageId: 'commands' },
      { id: 'command-confirm', label: '确认框', status: 'ready', pageId: 'commands' },
    ],
  },
]

export const catalogPages: CatalogPage[] = pages

/** 菜单条目 → 展示页路径；planned 条目没有 pageId，调用方必须先判状态。 */
export function pagePathOf(pageId: string): string {
  const page = pages.find((item) => item.id === pageId)
  if (page === undefined) throw new Error(`[demo] menu 指向不存在的展示页 ${pageId}`)
  return page.path
}

export const appPages: string[] = ['pages/index/index', ...pages.map((page) => page.path)]
