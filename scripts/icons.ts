import { appIconSvg } from '../src/art/icon'

// the app icon at ?size= pixels, at the page's top-left
const size = Number(new URLSearchParams(location.search).get('size') ?? 512)
const img = new Image(size, size)
img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(appIconSvg(size))
document.body.append(img)
