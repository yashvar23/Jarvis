import { test, expect, describe } from 'bun:test';
import { DesktopController } from './desktop-controller.ts';

describe('DesktopController', () => {
  test('constructor accepts custom port', () => {
    const ctrl = new DesktopController(9224);
    expect(ctrl).toBeDefined();
    expect(ctrl.connected).toBe(false);
  });

  test('constructor uses default port', () => {
    const ctrl = new DesktopController();
    expect(ctrl).toBeDefined();
    expect(ctrl.connected).toBe(false);
  });

  test('constructor accepts different port', () => {
    const ctrl = new DesktopController(9999);
    expect(ctrl).toBeDefined();
  });

  test('starts disconnected', () => {
    const ctrl = new DesktopController();
    expect(ctrl.connected).toBe(false);
  });
});
