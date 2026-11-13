// 组件出口：把全量图标样式一起带进包，消费端只引这一行。
// 只引了一条 @font-face 声明不会下载字体；元素真正用上某个库时，引擎才下载该字体。
// 要精细控制样式（例如只引基础包），改引 mp-taro-kit/ui/icon/<命名空间>/<库名>/style，不要引本出口。
import '../../icon/all/style/index.css'

export { Icon, ICON_SIZES, type IconProps, type IconSize } from './Icon.js'
