import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const i18nPath = path.join(__dirname, '../apps/sabine/src/i18n')

const loadJson = filename => {
  try {
    const filePath = path.join(i18nPath, filename)
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message)
    process.exit(1)
  }
}

const flattenKeys = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : ''
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenKeys(obj[k], pre + k))
    } else {
      acc[pre + k] = true
    }
    return acc
  }, {})
}

console.log('Verifying i18n keys...')

const en = loadJson('en.json')
const es = loadJson('es.json')
const pt = loadJson('pt.json')

const enKeys = Object.keys(flattenKeys(en))
const esKeys = flattenKeys(es)
const ptKeys = flattenKeys(pt)

let hasError = false

console.log(`Reference: en.json (${enKeys.length} keys)`)

const missingEs = enKeys.filter(key => !Object.hasOwn(esKeys, key))
if (missingEs.length > 0) {
  console.error('\n❌ Missing keys in es.json:')
  missingEs.forEach(key => console.error(`   - ${key}`))
  hasError = true
} else {
  console.log('✅ es.json passed')
}

const missingPt = enKeys.filter(key => !Object.hasOwn(ptKeys, key))
if (missingPt.length > 0) {
  console.error('\n❌ Missing keys in pt.json:')
  missingPt.forEach(key => console.error(`   - ${key}`))
  hasError = true
} else {
  console.log('✅ pt.json passed')
}

if (hasError) {
  console.error('\nVerification failed. Please add missing keys to translation files.')
  process.exit(1)
}

console.log('\nAll translation files are valid.')
