const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value) || /&(amp|lt|gt|quot|#39|apos|nbsp);/.test(value);
}

/**
 * HTML断片を人が読めるプレーンテキストに変換する。
 * Letter. 側のフォームが booking_data にHTMLごと保存してくるケースへの対処。
 * HTMLらしき文字列でなければそのまま返す。
 */
export function htmlToPlainText(value: string): string {
  if (!looksLikeHtml(value)) return value;
  let text = value
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6]|section|article)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "・")
    .replace(/<[^>]+>/g, "");
  text = text.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
