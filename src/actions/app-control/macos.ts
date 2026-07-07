import type { AppController, WindowInfo, UIElement } from './interface.ts';

export class MacAppController implements AppController {
  private notImplemented(method: string): never {
    throw new Error(
      `${method} not yet implemented for macOS.\n\n` +
      `TODO: Implement using one of:\n` +
      `  - AXUIElement API via N-API native bindings\n` +
      `  - AppleScript automation\n` +
      `  - node-mac-automation package\n` +
      `  - Swift/Objective-C bridge via FFI\n\n` +
      `Reference:\n` +
      `  - https://developer.apple.com/documentation/applicationservices/axuielement\n` +
      `  - https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/\n` +
      `  - https://github.com/sveinbjornt/AXElementsTester`
    );
  }

  async getActiveWindow(): Promise<WindowInfo> {
    this.notImplemented('getActiveWindow');
  }

  async getWindowTree(pid: number): Promise<UIElement[]> {
    this.notImplemented('getWindowTree');
  }

  async listWindows(): Promise<WindowInfo[]> {
    this.notImplemented('listWindows');
  }

  async clickElement(element: UIElement): Promise<void> {
    this.notImplemented('clickElement');
  }

  async typeText(text: string): Promise<void> {
    this.notImplemented('typeText');
  }

  async pressKeys(keys: string[]): Promise<void> {
    this.notImplemented('pressKeys');
  }

  async captureScreen(): Promise<Buffer> {
    this.notImplemented('captureScreen');
  }

  async captureWindow(pid: number): Promise<Buffer> {
    this.notImplemented('captureWindow');
  }

  async focusWindow(pid: number): Promise<void> {
    this.notImplemented('focusWindow');
  }
}
