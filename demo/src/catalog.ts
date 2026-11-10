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

// 展示页真源：一页对应一个库侧子域（或一组能力域），路由由 pages 派生。
// usage 与 renderNotes 由演示站维护方填写；此处只搭结构。
// 预留 id：skeleton（骨架屏归属 feedback / display 未定，不生成页面）。
export const pages: CatalogPage[] = [
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
        hint: 'Loader：ring 旋转 / blocks 三块脉动，五档尺寸 xs~xl',
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
    examples: [
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
        hint: 'styles/tokens：覆盖 --mptk-*',
        usage: '',
        imports: ['mp-taro-kit/styles/tokens', 'mp-taro-kit/design'],
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

// 菜单真源：前六组对齐 Vant Weapp 的公共分类，后两组收纳本库独有的非 UI 能力。
// 顺序固定：新增组件只把 planned 翻成 ready，不插队、不重排。
// planned 不是待办清单，只占住位置，避免以后加组件时整段重排。
export const menu: MenuGroup[] = [
  {
    id: 'base',
    title: '基础组件',
    entries: [
      { id: 'button', label: 'Button 按钮', status: 'ready', pageId: 'actions' },
      { id: 'cell', label: 'Cell 单元格', status: 'planned' },
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
      { id: 'switch', label: 'Switch 开关', status: 'planned' },
      { id: 'time-picker', label: 'TimePicker 时间选择', status: 'planned' },
      { id: 'uploader', label: 'Uploader 文件上传', status: 'planned' },
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
