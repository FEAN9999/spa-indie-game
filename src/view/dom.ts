import type * as Phaser from 'phaser'

/** HTML over the canvas, in canvas px: Phaser scales its DOM layer with the game. Styled by `.spa-dom` in index.html. */
export interface CodeBox {
  dom: Phaser.GameObjects.DOMElement
  textarea: HTMLTextAreaElement
  button: HTMLButtonElement
}

function button(label: string): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  return b
}

/** A text box with a button under it, its top centre at x, y. */
export function codeBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: { value?: string; readonly: boolean; placeholder?: string; button: string; onButton: (box: CodeBox) => void },
): CodeBox {
  const root = document.createElement('div')
  root.className = 'spa-dom'
  const textarea = document.createElement('textarea')
  textarea.readOnly = opts.readonly
  textarea.value = opts.value ?? ''
  textarea.placeholder = opts.placeholder ?? ''
  textarea.spellcheck = false
  textarea.setAttribute('autocapitalize', 'off')
  textarea.setAttribute('autocomplete', 'off')
  const btn = button(opts.button)
  root.append(textarea, btn)
  const box: CodeBox = { dom: scene.add.dom(x, y, root).setOrigin(0.5, 0), textarea, button: btn }
  btn.addEventListener('click', () => opts.onButton(box))
  return box
}

/** A real button, for actions the browser only allows straight from a tap (clipboard, install prompt). */
export function domButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: (button: HTMLButtonElement) => void,
): Phaser.GameObjects.DOMElement {
  const root = document.createElement('div')
  root.className = 'spa-dom'
  const btn = button(label)
  btn.addEventListener('click', () => onClick(btn))
  root.append(btn)
  return scene.add.dom(x, y, root)
}

/** Copies text; when the browser refuses, selects it in the box so the player can copy it by hand. */
export async function copyText(text: string, fallback: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    if (fallback) {
      fallback.focus()
      fallback.setSelectionRange(0, fallback.value.length)
    }
    return false
  }
}
