import type { AppController, WindowInfo, UIElement } from './interface.ts';

/**
 * Windows App Controller — stub.
 * Previously delegated to the C# DesktopController sidecar.
 * TODO: Implement local platform-native commands or route via Go sidecar.
 */
export class WindowsAppController implements AppController {
  async getActiveWindow(): Promise<WindowInfo> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async getWindowTree(_pid: number): Promise<UIElement[]> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async listWindows(): Promise<WindowInfo[]> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async clickElement(_element: UIElement): Promise<void> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async typeText(_text: string): Promise<void> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async pressKeys(_keys: string[]): Promise<void> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async captureScreen(): Promise<Buffer> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async captureWindow(_pid: number): Promise<Buffer> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }

  async focusWindow(_pid: number): Promise<void> {
    throw new Error('WindowsAppController: Not implemented. Use sidecar desktop tools with a target parameter.');
  }
}
