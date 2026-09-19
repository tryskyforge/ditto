let currentUrl = window.location.href;

export function getCurrentUrl(): string {
  return currentUrl;
}

export function updateUrl(url: string): void {
  currentUrl = url;
}
