import { readdirSync, readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { hashedFiles, precacheList, renderServiceWorker } from './build/sw.ts'

/** Every file under `dir`, relative to it, with forward slashes. */
const listFiles = (dir: string, prefix = ''): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listFiles(`${dir}/${e.name}`, `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  )

/** Writes sw.js, which precaches the whole build, and version.json, which the game polls for updates. */
function serviceWorkerPlugin(buildId: string): Plugin {
  return {
    name: 'spa-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = precacheList(Object.keys(bundle), listFiles('public'))
      const template = readFileSync('build/sw-template.js', 'utf8')
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: renderServiceWorker(template, buildId, files, hashedFiles(Object.keys(bundle))) })
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: buildId }) })
    },
  }
}

export default defineConfig(({ command }) => {
  const buildId = command === 'build' ? (process.env.BUILD_ID ?? process.env.GITHUB_SHA?.slice(0, 8) ?? Date.now().toString(36)) : 'dev'
  return {
    // relative, so the same build works under github.io/spa-indie-game/ and on localhost
    base: './',
    define: { __BUILD_ID__: JSON.stringify(buildId) },
    plugins: [serviceWorkerPlugin(buildId)],
    // Phaser in a file of its own, whose name stays the same while the game's code changes, so a phone keeps it across deploys
    build: { rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }] } } } },
    server: { host: true },
    preview: { host: true },
    // the sim tests run synchronously, so a timeout cannot stop a hang; a tight one only fails a long seed loop on a busy machine
    test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120_000 },
  }
})
