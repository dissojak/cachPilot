/** Only an https link is opened from the page; anything else is treated as "no link". */
export function receiptLink(url: string | undefined): string | undefined {
  return url && url.startsWith("https://") ? url : undefined;
}

/** Images are previewed in the page, other files (PDF…) only get a link. */
export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url);
}
