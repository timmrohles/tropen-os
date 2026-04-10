// src/lib/file-access/browser-check.ts

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Chrome') || ua.includes('Chromium')) return 'Chrome/Edge/Brave'
  return 'Unknown'
}

export function getBrowserInfo(): {
  supported: boolean
  browser: string
  suggestion?: string
} {
  if (isFileSystemAccessSupported()) {
    return { supported: true, browser: detectBrowser() }
  }
  return {
    supported: false,
    browser: detectBrowser(),
    suggestion:
      'Die File System Access API wird nur in Chrome, Edge und Brave unterstützt. ' +
      'Bitte wechsle den Browser.',
  }
}
