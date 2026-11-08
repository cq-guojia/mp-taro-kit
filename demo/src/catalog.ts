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

export type CatalogGroup = {
  id: string
  title: string
  pages: CatalogPage[]
}

// usage 与 renderNotes 由演示站维护方填写；此处只搭结构。
// 预留 id：skeleton（骨架屏归属 feedback / display 未定，不生成页面）。
export const catalog: CatalogGroup[] = [
  {
    id: 'ui',
    title: 'UI 容器与控件',
    pages: [
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
            hint: 'useStore：订阅全局单例',
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
            hint: 'Loader：ring 旋转 / blocks 三块脉动，三档尺寸',
            usage: '<Loader variant="blocks" size="md" />',
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
    ],
  },
  {
    id: 'foundation',
    title: '基础能力',
    pages: [
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
    ],
  },
  {
    id: 'commands',
    title: '命令式 API',
    pages: [
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
    ],
  },
]

export const catalogPages: CatalogPage[] = catalog.flatMap((group) => group.pages)

export const appPages: string[] = [
  'pages/index/index',
  ...catalogPages.map((page) => page.path),
]
