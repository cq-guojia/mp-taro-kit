# 文档索引

本目录维护本库的设计、对外契约、开发约定与外部依赖。控件的效果展示归 `demo/` 小程序演示站；组件的 props、组内行为与用法代码归 `api/` 下的组件文档，演示站不再展示代码。

## 目录

```text
docs/                                               # 项目文档库入口
├── architecture/                                   # 系统组成、分层与不可破的依赖约束
│   ├── demo-mapping.md                             # 演示站页分组、Taro 入口约定与库侧路径三层对应
│   ├── design-foundation.md                        # 基础色板、明暗对应与尺寸档位的设计依据
│   └── overview.md                                 # 五个能力域的分层、依赖方向、关键链路与不可破约束
├── guides/                                         # 具体操作步骤：接入、更新、排障
│   └── icon-update.md                              # 平台增删图标后同步生成物与验证的操作步骤
├── api/                                            # 对外承诺的契约与导出
│   ├── card.md                                     # Card 的竞品对比结论、槽位与设置契约、颜色双路、与 Cell 的组合
│   ├── cell.md                                     # Cell / CellGroup 的 props、组内行为与九种用法代码
│   ├── exports.md                                  # exports 子路径形态、挂载与注入约定、peer 版本下限
│   ├── icons.md                                    # 平台项目与命名规则、类名契约、多色行为与字体加载稳定性
│   ├── segmented.md                                # Segmented 的 items 契约、两种指示器与异步切换
│   └── switch.md                                   # Switch 的两种形状、三档尺寸与异步切换
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
- 2026-11-12 16:39:13：索引补 design-foundation.md 说明
- 2026-11-13 13:40:27：cell.md 补外框同色同宽契约，demo-mapping 同步 Cell 展示页拆分
- 2026-11-13 14:02:01：cell.md 改内线默认更浅并给出变量覆盖设置；design-foundation 补新语义键
- 2026-11-13 14:20:55：cell.md 收口三个控件级设置到 props（dividerTone 枚举、dividerInset、frame）；design-foundation 同步措辞
- 2026-11-13 14:36:07：demo-mapping 补示例分组与顺序判据，Cell 展示页按四组重排
- 2026-11-13 15:13:41：索引补 card.md；Card 契约、设计语义键、演示站映射与 Cell 组合同步
- 2026-11-13 16:42:48：Card 与 Cell 组合改为零参数契约，card.md / cell.md / exports.md / demo-mapping 同步
- 2026-11-13 18:43:59：Card / Cell / exports / design-foundation 同步贴边留白归属：改为 Card 侧归零
- 2026-11-13 19:09:20：演示站展示顺序同步：组合示例归引用方 Cell 页末组，Card 页不再向下引用 Cell
- 2026-11-13 23:24:16：图标分层改造同步：契约、出口、更新指南与映射说明
- 2026-11-13 23:51:56：图标文档补 Icon 组件与全量入口说明
- 2026-11-14 01:24:34：design-foundation 补站点级覆盖与控件默认尺寸，demo-mapping 同步主题配置页
- 2026-11-14 01:31:50：design-foundation 补 .mptk-light 局部明色，exports 同步运行时出口
- 2026-11-14 01:45:00：demo-mapping 补主题配置页四组清单与三页职责边界
- 2026-11-14 11:23:22：配置页改回 Cell 并标出明暗色值，cell/card 文档补卡片内左右内收
- 2026-11-14 11:37:33：分隔线默认内缩并删开关，配置页改用 Card 与色条写值
- 2026-11-14 11:45:51：配置页三张卡片即三块，去掉示例块外层的卡片套卡片
