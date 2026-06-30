/**
 * CSV 文字列 → Shift_JIS Buffer エンコード
 *
 * GAS版の sanitizeForShiftJIS と同じ2段構え:
 *   1. replaceUnsafeChars で既知の環境依存文字を置換 (transform.mjs 側で適用済みだが念のため再適用)
 *   2. 残った文字を1文字ずつ Shift_JIS 変換チェックし、変換不能なら「?」に置換 + ログ収集
 */

import iconv from 'iconv-lite';
import { replaceUnsafeChars } from './transform.mjs';

/** 1文字が Shift_JIS に変換可能か (GAS isShiftJISSafe 相当) */
function isShiftJISSafe(char) {
  const bytes = iconv.encode(char, 'Shift_JIS');
  // 変換不能文字は iconv-lite が 0x3F ('?') 1バイトにする
  if (bytes.length === 1 && bytes[0] === 0x3f && char !== '?') {
    return false;
  }
  return true;
}

/**
 * @param {string} csvString UTF-8 内部表現の CSV 文字列
 * @returns {{ buffer: Buffer, unmapped: string[] }}
 */
export function encodeShiftJIS(csvString) {
  const replaced = replaceUnsafeChars(csvString);
  const unmapped = new Set();
  let safe = '';
  for (const ch of replaced) {
    if (isShiftJISSafe(ch)) {
      safe += ch;
    } else {
      unmapped.add(ch);
      safe += '?';
    }
  }
  return {
    buffer: iconv.encode(safe, 'Shift_JIS'),
    unmapped: Array.from(unmapped),
  };
}
