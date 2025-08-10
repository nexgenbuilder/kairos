import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toJSONSafe } from './json';

describe('toJSONSafe', () => {
  it('converts BigInt to Number', () => {
    const input = { value: 42n };
    const result = toJSONSafe(input);
    assert.strictEqual(typeof result.value, 'number');
    assert.strictEqual(result.value, 42);
  });

  it('converts Date to ISO string', () => {
    const date = new Date('2024-01-02T03:04:05.000Z');
    const result = toJSONSafe(date);
    assert.strictEqual(result, date.toISOString());
  });

  it('retains structure without undefined values in nested objects and arrays', () => {
    const input = {
      level1: {
        arr: [
          { keep: 1, omit: undefined },
          [
            { omit: undefined },
            { keep: 2 }
          ]
        ],
        omit: undefined
      },
      top: undefined
    };

    const expected = {
      level1: {
        arr: [
          { keep: 1 },
          [
            {},
            { keep: 2 }
          ]
        ]
      }
    };

    const result = toJSONSafe(input);
    assert.deepStrictEqual(result, expected);
  });
});

