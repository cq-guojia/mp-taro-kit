// @mptk-inputs:42f65ab592fc
// 请勿手改：由 scripts/gen-kit-config.mjs 从 kit.config.mjs 生成（runtime 层默认表）。
// 改皮肤请改 kit.config.mjs 或消费方自己的差异文件，然后重新构建。

export interface KitConfigDefaults {
  schemaVersion: number
  runtime: {
    toastDuration: number
    notifyLimit: number
    controlSizeDefault: 'sm' | 'md' | 'lg'
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
      "toastDuration": 2000,
      "notifyLimit": 3,
      "controlSizeDefault": "md",
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
