# 文档索引

本目录维护本库的设计、对外契约、开发约定与外部依赖。控件的效果展示归 `demo/` 小程序演示站；组件的 props、组内行为与用法代码归 `api/` 下的组件文档，演示站不再展示代码。

## 目录

```text
docs/                                               # 项目文档库入口
├── architecture/                                   # 系统组成、分层与不可破的依赖约束
│   ├── demo-mapping.md                             # 演示站页分组、Taro 入口约定与库侧路径三层对应
│   └── overview.md                                 # 五个能力域的分层、依赖方向、关键链路与不可破约束
├── guides/                                         # 具体操作步骤：接入、更新、排障
│   └── icon-update.md                              # 平台增删图标后同步生成物与验证的操作步骤
├── api/                                            # 对外承诺的契约与导出
│   ├── cell.md                                     # Cell / CellGroup 的 props、组内行为与九种用法代码
│   ├── exports.md                                  # exports 子路径形态、挂载与注入约定、peer 版本下限
│   ├── icons.md                                    # 平台项目与命名规则、类名契约、多色行为与字体加载稳定性
│   ├── segmented.md                                # Segmented 的 items 契约、两种指示器与异步回弹
│   └── switch.md                                   # Switch 的两种形状、三档尺寸与异步回弹
├── development/                                    # 本地开发、构建与验证约定
│   └── build-and-test.md                           # 构建与自检顺序、工程约定，以及实机验证不在这套自检内的边界
└── dependencies/                                   # 外部依赖的已核实行为与已知坑
    ├── compiler-toolchain.md                       # TypeScript / Sass / pnpm 的已核实行为、版本真源与已知限制
    └── skyline-rendering.md                        # 页面滚动约束，以及字体图标在 skyline 下的两个实测坑
```

## 更新日志

- 2026-11-10 12:27:34：索引按 1.2.0 规范改为字符画树
- 2026-11-11 22:30:26：索引补 cell.md 说明，用法代码改归 docs/api
- 2026-11-12 14:53:57：索引补 switch.md 与 segmented.md
