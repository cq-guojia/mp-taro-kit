// 图标库注册表：唯一真源。一条记录 = 一个 iconfont 项目 = 一种字体 = 一套类名。
// id 用「命名空间.库名[.color]」，点号直接映射目录层级与 exports 路径：
//   common.base.color → src/ui/icon/common/base/color → mp-taro-kit/ui/icon/common/base/color
// visibility: public 进组件库并对外发布；demo 只进演示站，不进 npm 包。
// common.* 是跨开源框架共用的图标基础库，mp-taro-kit.* 是本框架自有，demo 不对外。
// 新增图标库只加一条记录，不改生成器、单测与 package.json。
export const SOURCES = [
  {
    id: 'common.base',
    source: 'https://at.alicdn.com/t/c/font_5252971_834xyulhmq2.css',
    visibility: 'public',
  },
  {
    id: 'common.base.color',
    source: 'https://at.alicdn.com/t/c/font_5252972_tyb3966r1rh.css',
    visibility: 'public',
  },
  {
    id: 'common.logo',
    source: 'https://at.alicdn.com/t/c/font_5252974_y0yj8zp5mvm.css',
    visibility: 'public',
  },
  {
    id: 'common.logo.color',
    source: 'https://at.alicdn.com/t/c/font_5252975_6bexc5n5vn5.css',
    visibility: 'public',
  },
  {
    id: 'mp-taro-kit.base',
    source: 'https://at.alicdn.com/t/c/font_5251349_rhl0bjkzk0c.css',
    visibility: 'public',
  },
  {
    id: 'mp-taro-kit.base.color',
    source: 'https://at.alicdn.com/t/c/font_5252363_0grcfdbplzmb.css',
    visibility: 'public',
  },
  {
    id: 'mp-taro-kit.demo',
    source: 'https://at.alicdn.com/t/c/font_5252365_ymsdcprbxvc.css',
    visibility: 'demo',
  },
  {
    id: 'mp-taro-kit.demo.color',
    source: 'https://at.alicdn.com/t/c/font_5252364_pqxmtk35gcs.css',
    visibility: 'demo',
  },
]
