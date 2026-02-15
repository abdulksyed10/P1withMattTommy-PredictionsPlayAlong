// /components/predictions/utils.ts
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

// Keep as a hook point if you later add fallback logic (CDN, placeholder, etc.)
export function safeImg(src: string) {
  return src;
}