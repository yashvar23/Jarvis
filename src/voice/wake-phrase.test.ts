import { describe, expect, test } from 'bun:test';
import { containsWakePhrase } from './wake-phrase.ts';

describe('containsWakePhrase', () => {
  test('matches the bare wake phrase', () => {
    expect(containsWakePhrase('zoya')).toBe(true);
    expect(containsWakePhrase('Zoya')).toBe(true);
    expect(containsWakePhrase('ZOYA')).toBe(true);
  });

  test('matches when the wake phrase appears mid-sentence', () => {
    expect(containsWakePhrase('Hey Zoya, how are you')).toBe(true);
    expect(containsWakePhrase('Tell Zoya to send the email')).toBe(true);
    expect(containsWakePhrase('I told zoya already')).toBe(true);
  });

  test('respects word boundaries (does not match substrings)', () => {
    expect(containsWakePhrase('zoyason')).toBe(false);
    expect(containsWakePhrase('starzoya')).toBe(false);
    expect(containsWakePhrase('antizoyat')).toBe(false);
  });

  test('treats punctuation as a word boundary', () => {
    expect(containsWakePhrase('Hello, Zoya.')).toBe(true);
    expect(containsWakePhrase('"Zoya!"')).toBe(true);
    expect(containsWakePhrase('(zoya)')).toBe(true);
    expect(containsWakePhrase('Zoya?')).toBe(true);
  });

  test('handles empty / null-ish input safely', () => {
    expect(containsWakePhrase('')).toBe(false);
    // The function takes string only, but we exercise the early-exit
    // branch by passing an empty string explicitly.
    expect(containsWakePhrase(' ')).toBe(false);
  });

  test('handles whitespace-only and unrelated text', () => {
    expect(containsWakePhrase('hello world')).toBe(false);
    expect(containsWakePhrase('the assistant said hello')).toBe(false);
    expect(containsWakePhrase('   ')).toBe(false);
  });

  test('is robust to multiline TTS input (the daemon flag-on-tts_text use case)', () => {
    expect(containsWakePhrase('First sentence.\nSecond sentence with Zoya.')).toBe(true);
    expect(containsWakePhrase('Line one.\nLine two.\nLine three.')).toBe(false);
  });

  test('matches multiple occurrences (still returns true; not a count)', () => {
    expect(containsWakePhrase('Zoya told Zoya about Zoya')).toBe(true);
  });
});

