#!/usr/bin/env node
/**
 * One-time setup for bdsa-nft-reviewer.
 *
 * This app depends on bdsa-react-components via a relative file: path because
 * the library is not published to npm and `github:` installs ship an empty
 * dist/ folder (the lib's package.json `files` field doesn't include source).
 *
 * What this script does:
 *   1. If ../bdsa-react-components is missing, clone Gutman-Lab/bdsa-react-components into it.
 *   2. If its dist/ is missing, npm install + npm run build inside it.
 *   3. Run npm install in this app (which will then resolve the local file: dep).
 *
 * Safe to re-run.
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_DIR = resolve(__dirname, '..')
const LIB_DIR = resolve(APP_DIR, '..', 'bdsa-react-components')
const LIB_GIT = 'https://github.com/Gutman-Lab/bdsa-react-components.git'

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}    (in ${cwd})`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function step(label, fn) {
  console.log(`\n=== ${label} ===`)
  fn()
}

step('Library checkout', () => {
  if (!existsSync(LIB_DIR)) {
    console.log(`Cloning ${LIB_GIT} -> ${LIB_DIR}`)
    run(`git clone ${LIB_GIT} "${LIB_DIR}"`, resolve(LIB_DIR, '..'))
  } else {
    console.log(`Found existing checkout at ${LIB_DIR}`)
  }
})

step('Library build', () => {
  const distExists = existsSync(resolve(LIB_DIR, 'dist', 'index.js'))
  const nodeModulesExists = existsSync(resolve(LIB_DIR, 'node_modules'))
  if (!nodeModulesExists) {
    run('npm install --no-audit --no-fund', LIB_DIR)
  }
  if (!distExists) {
    run('npm run build', LIB_DIR)
  } else {
    console.log('Library dist/ already exists. Skipping rebuild.')
  }
})

step('App install', () => {
  run('npm install --no-audit --no-fund', APP_DIR)
})

console.log('\nSetup complete. Run:  npm run dev')
