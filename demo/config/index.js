// Taro 4 工程配置。sourceRoot 固定为 src：app.tsx / app.config.ts / pages 都相对它解析。
// 入口配置的真源在根目录 app.config.ts，由 src/app.config.ts 转发给编译器。
export default {
  projectName: 'mp-taro-kit-demo',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'vite',
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
}
