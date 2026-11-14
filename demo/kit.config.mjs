// 演示站（消费方）的统一配置：只写与库默认表不同的键，其余全部吃库默认。
// 全量可配项清单、中文名、单位与当前生效值，见 src/kit-config.generated.ts 的 KIT_CONFIG_ROWS
// （由 Taro 插件 mp-taro-kit/plugin 在每次构建前生成，请勿手改）。
//
// 库默认表：mp-taro-kit/dist/config/defaults.mjs；本项目的接入声明：config/index.js。
// 保存本文件即自动重算并重编译，不需要敲任何命令，也不需要重启 watch。
//
// 可覆盖的分组：primitives / base / surface / light / dark / component / structure / runtime / window。
// 值三种写法：字面量 '12px'；CSS 运行时别名 'var(--mptk-radius-md)'；配置层别名 '@blue' / '@light:gray-2'。
// light 与 dark 必须同名同数；component / structure 改了会影响控件几何与布局，慎改但允许改。
export default {
  // 示意一个真实差异：站点把转圈周期从库默认的 .8s 放慢到 .9s。
  // 它只影响本站生成的 app-theme.scss，不会写进库发布产物 dist/。
  component: {
    '--mptk-c-spinner-rotate-dur': '.9s',
  },
}
