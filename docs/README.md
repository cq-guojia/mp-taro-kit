# 文档索引

本目录维护本库的设计、对外契约、开发约定与外部依赖。控件的使用方法与效果展示归 `demo/` 小程序演示站，不在本目录内；本目录只给出指向，演示站不反向引用本目录。

## 目录

- architecture/
  - [演示站页与能力域映射](architecture/demo-mapping.md) — 演示站页分组、Taro 入口约定与库侧路径三层对应
  - [架构总览](architecture/overview.md) — 五个能力域的分层、依赖方向、关键链路与不可破约束
- guides/
  - [更新图标字体](guides/icon-update.md) — 平台增删图标后同步生成物与验证的操作步骤
- api/
  - [对外契约](api/exports.md) — exports 子路径形态、挂载与注入约定、peer 版本下限
  - [图标字体](api/icons.md) — 平台项目与命名规则、类名契约、多色行为与字体加载稳定性
- development/
  - [本地开发与验证](development/build-and-test.md) — 构建与自检顺序、工程约定，以及实机验证不在这套自检内的边界
- dependencies/
  - [编译期工具链](dependencies/compiler-toolchain.md) — TypeScript / Sass / pnpm 的已核实行为、版本真源与已知限制
  - [Skyline 渲染引擎](dependencies/skyline-rendering.md) — 页面滚动约束，以及字体图标在 skyline 下的两个实测坑
