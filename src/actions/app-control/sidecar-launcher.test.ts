import { test, expect, describe } from 'bun:test';
import { findSidecarExecutable, getWSLHostIP } from './sidecar-launcher.ts';

describe('sidecar-launcher', () => {
  test('findSidecarExecutable returns string or null', () => {
    const result = findSidecarExecutable();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('getWSLHostIP returns a string', () => {
    const ip = getWSLHostIP();
    expect(typeof ip).toBe('string');
    expect(ip.length).toBeGreaterThan(0);
  });

  test('getWSLHostIP returns localhost or valid IP', () => {
    const ip = getWSLHostIP();
    // Either "localhost" or an IPv4 address
    const isLocalhost = ip === 'localhost';
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(ip);
    expect(isLocalhost || isIP).toBe(true);
  });
});
