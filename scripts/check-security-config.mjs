#!/usr/bin/env node

/**
 * Security configuration check script
 * Scans for common accidental secret exposure.
 * 
 * NOTE: This scan cannot prove the application is completely secure.
 * It checks for common misconfigurations only.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let issues = 0;

function check(name, condition, message) {
  if (condition) {
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name}: ${message}`);
    issues++;
  }
}

console.log('🔒 Security Configuration Check\n');

// Check for .env files that shouldn't be committed
console.log('Environment Files:');
check('.env not committed', !existsSync(join(ROOT, '.env')), '.env file exists - ensure it is in .gitignore');
check('.env.example exists', existsSync(join(ROOT, '.env.example')), 'Missing .env.example');

// Check .gitignore
if (existsSync(join(ROOT, '.gitignore'))) {
  const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
  check('.gitignore excludes .env', gitignore.includes('.env'), '.env not in .gitignore');
  check('.gitignore excludes node_modules', gitignore.includes('node_modules'), 'node_modules not in .gitignore');
}

// Check for hardcoded secrets in source
console.log('\nSource Code:');
const srcDir = join(ROOT, 'src');
if (existsSync(srcDir)) {
  const suspiciousPatterns = [
    /sk_[a-zA-Z0-9]{20,}/,  // Supabase service role key pattern
    /eyJhbGciOiJIUzI1NiJ9\.[a-zA-Z0-9._-]+/,  // JWT tokens
    /-----BEGIN RSA PRIVATE KEY-----/,  // Private keys
    /password\s*[:=]\s*['"][^'"]{8,}['"]/,  // Hardcoded passwords
  ];

  function scanDir(dir) {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = join(dir, file.name);
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(content)) {
              console.log(`  ⚠️  Suspicious pattern in ${fullPath.replace(ROOT, '')}`);
              issues++;
            }
          }
        } catch {}
      }
    }
  }
  scanDir(srcDir);
  if (issues === 0) console.log('  ✅ No obvious hardcoded secrets found');
}

// Check for service role key usage
console.log('\nSupabase Configuration:');
const supabaseClient = join(ROOT, 'src/lib/supabase/client.ts');
if (existsSync(supabaseClient)) {
  const content = readFileSync(supabaseClient, 'utf-8');
  check('No service-role key', !content.includes('service_role') && !content.includes('SERVICE_ROLE'), 'Service role key found in client code');
  check('Uses anon/publishable key', content.includes('PUBLISHABLE_KEY') || content.includes('anon'), 'Should use publishable/anon key');
}

// Summary
console.log('\n' + '─'.repeat(50));
if (issues === 0) {
  console.log('✅ All checks passed!');
} else {
  console.log(`❌ ${issues} issue(s) found. Review and fix before deployment.`);
}
console.log('\n⚠️  This scan checks for common misconfigurations only.');
console.log('   It cannot prove the application is completely secure.');

process.exit(issues > 0 ? 1 : 0);
