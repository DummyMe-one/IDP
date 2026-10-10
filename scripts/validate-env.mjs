#!/usr/bin/env node

/**
 * Validate environment variables before build.
 * Ensures required public variables are set.
 */

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
const optional = ['VITE_BASE_PATH'];

let hasErrors = false;

console.log('🔍 Validating environment variables...\n');

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.log(`  ❌ ${key} is not set (required)`);
    hasErrors = true;
  } else {
    const isPlaceholder = /placeholder|your-project|your-anon-key/i.test(value);
    if (isPlaceholder) {
      console.log(`  ❌ ${key} contains a placeholder value`);
      hasErrors = true;
      continue;
    }

    if (key === 'VITE_SUPABASE_URL') {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:') throw new Error('URL must use HTTPS');
      } catch {
        console.log(`  ❌ ${key} must be a valid HTTPS URL`);
        hasErrors = true;
        continue;
      }
    }

    console.log(`  ✅ ${key} is configured`);
  }
}

for (const key of optional) {
  const value = process.env[key];
  if (value) {
    console.log(`  ✅ ${key} = ${value}`);
  } else {
    console.log(`  ℹ️  ${key} not set (optional, defaults to /)`);
  }
}

// Security check: ensure no secret keys are present
const forbidden = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET', 'DATABASE_PASSWORD'];
for (const key of forbidden) {
  if (process.env[key]) {
    console.log(`  🚨 ${key} is set in environment — this should NEVER be in frontend builds!`);
    hasErrors = true;
  }
}

console.log('');
if (hasErrors) {
  console.log('❌ Validation failed. Fix the issues above before building.');
  process.exit(1);
} else {
  console.log('✅ All checks passed.');
}
