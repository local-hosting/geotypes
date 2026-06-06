#!/usr/bin/env ts-node
import { nanoid } from 'nanoid'

console.log('🧪 Testing Short ID Generator (using nanoid library)\n')

// Test basic short ID generation (4 chars)
console.log('📝 Basic short IDs:')
for (let i = 0; i < 5; i++) {
  console.log(`  ${nanoid(4)}`)
}

console.log('\n🔤 With custom prefix:')
for (let i = 0; i < 5; i++) {
  console.log(`  feat_${nanoid(4)}`)
}

console.log('\n✅ Short ID generator test complete!')
console.log('\n💡 Usage in your app:')
console.log('  - Default: nanoid(4)')
console.log('  - With prefix: `feat_${nanoid(4)}`')
console.log('\n🎯 Benefits of nanoid:')
console.log('  - URL-friendly characters')
console.log('  - Collision-resistant')
console.log('  - Well-tested library')
console.log('  - Supports fixed length') 