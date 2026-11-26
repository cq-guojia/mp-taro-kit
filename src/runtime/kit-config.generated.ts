// @mptk-inputs:9a928edd32b8
// 请勿手改：由 scripts/gen-kit-config.mjs 从 kit.config.mjs 生成（runtime 层默认表）。
// 改皮肤请改 kit.config.mjs 或消费方自己的差异文件，然后重新构建。

export interface KitConfigDefaults {
  schemaVersion: number
  runtime: {
    controlSizeDefault: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    dialog: {
      confirmText: string
      cancelText: string
      confirm: { type: 'default' | 'primary' | 'success' | 'warning' | 'danger'; variant: 'solid' | 'soft' | 'outline' | 'ghost' }
      cancel: { type: 'default' | 'primary' | 'success' | 'warning' | 'danger'; variant: 'solid' | 'soft' | 'outline' | 'ghost' }
    }
    core: {
      baseURL: string
      timeout: number
      storagePrefix: string
      debug: boolean
      headers: Record<string, string>
    }
  }
  window: { light: Record<string, string>; dark: Record<string, string> }
}

export const DEFAULT_KIT_CONFIG: KitConfigDefaults = {
    "schemaVersion": 1,
    "runtime": {
      "controlSizeDefault": "sm",
      "dialog": {
        "confirmText": "确定",
        "cancelText": "取消",
        "confirm": {
          "type": "primary",
          "variant": "solid",
        },
        "cancel": {
          "type": "default",
          "variant": "soft",
        },
      },
      "core": {
        "baseURL": "",
        "timeout": 10000,
        "storagePrefix": "mptk:",
        "debug": false,
        "headers": {

        },
      },
    },
    "window": {
      "light": {
        "bgColor": "#f2f3f5",
        "bgTxtStyle": "light",
        "navBgColor": "#fff",
        "navTxtStyle": "black",
      },
      "dark": {
        "bgColor": "#15181c",
        "bgTxtStyle": "dark",
        "navBgColor": "#15181c",
        "navTxtStyle": "white",
      },
    },
  }
