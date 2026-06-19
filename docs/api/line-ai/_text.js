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

export function normalizeLineMessageText(message) {
  const rawText = cleanUnicodeText(message?.text || "").trim();
  const emojis = Array.isArray(message?.emojis) ? message.emojis : [];
  if (!rawText || !emojis.length) return rawText;

  let text = rawText;
  const sorted = emojis
    .map((emoji) => ({
      index: Number(emoji?.index),
      length: Number(emoji?.length)
    }))
    .filter((emoji) => Number.isInteger(emoji.index) && Number.isInteger(emoji.length) && emoji.index >= 0 && emoji.length > 0)
    .sort((a, b) => b.index - a.index);

  for (const emoji of sorted) {
    if (emoji.index > text.length) continue;
    text = `${text.slice(0, emoji.index)}絵文字${text.slice(emoji.index + emoji.length)}`;
  }

  return cleanUnicodeText(text).replace(/\s+/g, " ").trim();
}

export function stripEmojiForFallback(value) {
  return cleanUnicodeText(value)
    .replace(/[\u200d\ufe0f]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
