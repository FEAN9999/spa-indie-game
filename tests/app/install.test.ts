import { describe, expect, it } from 'vitest'
import { installPlatform } from '../../src/app/install'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
const IPAD_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'
const WINDOWS_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

describe('install platform', () => {
  it('offers the iOS steps in Safari on an iPhone, but not inside the installed app', () => {
    expect(installPlatform({ ua: IPHONE_SAFARI, maxTouchPoints: 5, standalone: false })).toBe('ios')
    expect(installPlatform({ ua: IPHONE_SAFARI, maxTouchPoints: 5, standalone: true })).toBeNull()
  })

  it('tells an iPad from a Mac by its touch points', () => {
    expect(installPlatform({ ua: IPAD_SAFARI, maxTouchPoints: 5, standalone: false })).toBe('ios')
    expect(installPlatform({ ua: IPAD_SAFARI, maxTouchPoints: 0, standalone: false })).toBeNull()
  })

  it('treats Chrome on an iPhone as iOS', () => {
    expect(installPlatform({ ua: IPHONE_CHROME, maxTouchPoints: 5, standalone: false })).toBe('ios')
  })

  it('offers the Android steps on Android and nothing on a desktop', () => {
    expect(installPlatform({ ua: ANDROID_CHROME, maxTouchPoints: 5, standalone: false })).toBe('android')
    expect(installPlatform({ ua: WINDOWS_CHROME, maxTouchPoints: 0, standalone: false })).toBeNull()
  })
})
