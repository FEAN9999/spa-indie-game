export type InstallPlatform = 'ios' | 'android'

export interface InstallEnv {
  ua: string
  maxTouchPoints: number
  standalone: boolean
}

/** Which install steps to show; null inside the installed app or away from a phone or tablet. */
export function installPlatform(env: InstallEnv): InstallPlatform | null {
  if (env.standalone) return null
  // iPadOS Safari says it is a Mac; only the touch screen gives it away
  if (/iPhone|iPad|iPod/.test(env.ua) || (/Macintosh/.test(env.ua) && env.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(env.ua)) return 'android'
  return null
}

export function currentInstallEnv(): InstallEnv {
  return {
    ua: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

/** Chrome's install prompt, held from page load until the player taps "Cài". */
let deferred: BeforeInstallPromptEvent | null = null

export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
  })
}

export function canPromptInstall(): boolean {
  return deferred !== null
}

export async function promptInstall(): Promise<void> {
  const e = deferred
  // Chrome shows each prompt once
  deferred = null
  await e?.prompt()
}
