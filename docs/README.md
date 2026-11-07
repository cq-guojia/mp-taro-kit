# 文档索引

本目录维护本库的设计、对外契约、开发约定与外部依赖。控件的使用方法与效果展示归 `demo/` 小程序演示站，不在本目录内；本目录只给出指向，演示站不反向引用本目录。

## 目录

- architecture/
  - [演示站页与能力域映射](architecture/demo-mapping.md) — 演示站页分组、Taro 入口约定与库侧路径三层对应
  - [架构总览](architecture/overview.md) — 五个能力域的分层、依赖方向、关键链路与不可破约束
- api/
  - [对外契约](api/exports.md) — exports 子路径形态、挂载与注入约定、peer 版本下限
- development/
  - [本地开发与验证](development/build-and-test.md) — 构建与自检顺序、工程约定，以及实机验证不在这套自检内的边界
- dependencies/
  - [编译期工具链](dependencies/compiler-toolchain.md) — TypeScript / Sass / pnpm 的已核实行为、版本真源与已知限制
