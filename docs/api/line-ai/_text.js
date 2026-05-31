export function cleanUnicodeText(value) {
  const input = String(value ?? "");
  let output = "";

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += input[index] + input[index + 1];
        index += 1;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    output += input[index];
  }

  return output;
}

export function truncateText(value, maxLength) {
  const text = cleanUnicodeText(value);
  const limit = Number(maxLength);
  if (!Number.isFinite(limit) || limit <= 0) return "";

  const chars = Array.from(text);
  if (chars.length <= limit) return text;
  return chars.slice(0, limit).join("");
}

export function unicodeLength(value) {
  return Array.from(cleanUnicodeText(value)).length;
}
