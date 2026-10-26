import type * as Phaser from 'phaser'
import { sound } from '../audio/engine'

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

/** A one-line text box centred on x, y. Enter closes the keyboard. */
export function nameInput(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: { value: string; placeholder: string; maxLength: number },
): { dom: Phaser.GameObjects.DOMElement; input: HTMLInputElement } {
  const root = document.createElement('div')
  root.className = 'spa-dom spa-name'
  const input = document.createElement('input')
  input.type = 'text'
  input.value = opts.value
  input.placeholder = opts.placeholder
  input.maxLength = opts.maxLength
  input.spellcheck = false
  input.setAttribute('autocapitalize', 'words')
  input.setAttribute('autocomplete', 'off')
  input.setAttribute('autocorrect', 'off')
  input.setAttribute('enterkeyhint', 'done')
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur()
  })
  // iOS can leave the page shifted up after the keyboard closes
  input.addEventListener('blur', () => window.scrollTo(0, 0))
  root.append(input)
  return { dom: scene.add.dom(x, y, root), input }
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
  btn.addEventListener('click', () => {
    sound.play('tap')
    onClick(btn)
  })
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
