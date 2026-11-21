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
│   ├── app.md                                      # 应用级一条接入：createKitApp、三件按需宿主、KitPage 页面壳、登录窗注册口
│   ├── back-to-top.md                              # 阈值显隐的回顶按钮：一次节点命令回顶、duration 可配、阈值翻转才 setState
│   ├── button.md                                   # Button 的四轴外观、品牌色派生、纯图标正方形与三档加载
│   ├── card.md                                     # Card 的竞品对比结论、槽位与设置契约、颜色双路、与 Cell 的组合
│   ├── cell.md                                     # Cell / CellGroup 的 props、组内行为与九种用法代码
│   ├── config.md                                   # 统一配置真源、生成链、Taro 插件一次性接入与全量可配项
│   ├── divider.md                                  # 分隔线的纯线形态、带文字形态与 contentPosition 契约
│   ├── exports.md                                  # exports 子路径形态、挂载与注入约定、peer 版本下限
│   ├── floating-action.md                          # 常驻浮动按钮的两层拆分、位置档、受控显隐与进出场
│   ├── icons.md                                    # 平台项目与命名规则、类名契约、多色行为与字体加载稳定性
│   ├── overlay.md                                  # 遮罩与浮层底座：一份遮罩、一条层级链、进出场与安全区注入
│   ├── popup.md                                    # Popup 五档与裸壳、关闭按钮三轴、ImagePopup 图片弹窗尺寸模型
│   ├── content-popup.md                            # ContentPopup 内容弹窗：三档头部、背景三作用域、按钮两轴与外伸徽标
│   ├── segmented.md                                # Segmented 的 items 契约、两种指示器与异步切换
│   ├── switch.md                                   # Switch 的两种形状、五档尺寸与异步切换
│   └── tag.md                                      # 标签的高度刻度、底色形态、圆角档与图标规则，以及与 Badge 的边界
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
- 2026-11-14 12:12:20：默认控件档改 md，演示站清掉写死尺寸与圆角
- 2026-11-14 12:26:40：色板补 white / ink 命名，配置页色条写名字而非色值
- 2026-11-14 12:37:19：卡片默认圆角改 md，首页主题块改用 Card
- 2026-11-14：图标尺寸并入字号体系（icons / design-foundation 同步），补图标尺寸档示例
- 2026-11-14：Card 头部默认带分隔线、说明字号降到 xs；主题配置页三块统一用 Card 标题
- 2026-11-14：Cell 默认垂直居中、`center={false}` 顶部对齐；主题配置页英文别名改走注释字号
- 2026-11-14 23:43:34：索引补 api/config.md
- 2026-11-15 14:18:54：索引补 api/tag.md
- 2026-11-15 14:51:31：索引补 api/divider.md
- 2026-11-15 15:35:00：索引补 api/button.md
- 2026-11-15 16:45:00：控件默认档 md → sm（32 / 14，对齐 WeUI mini）
- 2026-11-16：索引补 api/overlay.md（遮罩收一份、层级收一条链）
- 2026-11-19：overlay.md 描述补 Popup / ImagePopup，索引与文档实际内容对齐
- 2026-11-19：索引补 api/popup.md（Popup / ImagePopup 组件契约从 overlay.md 拆出）
- 2026-11-19：索引补 api/floating-action.md（常驻浮动按钮的两层拆分与受控显隐）
- 2026-11-20 14:23:46：索引补 api/back-to-top.md（阈值回顶、一次节点命令、滚动受控喂入）
- 2026-11-20：索引补 api/app.md（createKitApp 一条接入、三件按需宿主、KitPage 页面壳、登录窗注册口）；back-to-top 描述同步为一次节点命令
- 2026-11-21：索引补 api/content-popup.md（ContentPopup 内容弹窗：三档头部、背景三作用域、按钮两轴与外伸徽标）
