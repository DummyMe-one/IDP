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
  const value = process.env[key];
  if (!value) {
    console.log(`  ❌ ${key} is not set (required)`);
    hasErrors = true;
  } else if (value.includes('placeholder') || value === '') {
    console.log(`  ⚠️  ${key} appears to be a placeholder value`);
  } else {
    console.log(`  ✅ ${key} is set`);
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
