/**
 * Firebase Configuration Debugger
 * 
 * This utility helps identify and diagnose Firebase configuration issues
 * Use in development to troubleshoot auth/invalid-api-key errors
 */

export const debugFirebaseConfig = () => {
  console.group('🔍 Firebase Configuration Debug');

  // Check environment variables
  const envVars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
  };

  console.group('✓ Environment Variables Status');
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? `"${value.substring(0, 20)}..."` : 'UNDEFINED';
    console.log(`${status} ${key}: ${displayValue}`);
  });
  console.groupEnd();

  // Check API Key format
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (apiKey) {
    console.group('🔑 API Key Validation');
    console.log(`✓ API Key length: ${apiKey.length}`);
    console.log(`✓ Starts with "AIza": ${apiKey.startsWith('AIza') ? '✅' : '⚠️'}`);
    console.log(`✓ Contains special chars: ${/[_\-]/.test(apiKey) ? '✅' : '⚠️'}`);
    console.groupEnd();
  }

  // Check Auth Domain format
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (authDomain) {
    console.group('🔐 Auth Domain Validation');
    console.log(`✓ Auth Domain: ${authDomain}`);
    console.log(`✓ Contains "firebaseapp.com": ${authDomain.includes('firebaseapp.com') ? '✅' : '⚠️'}`);
    console.groupEnd();
  }

  // Check Project ID format
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId) {
    console.group('📋 Project ID Validation');
    console.log(`✓ Project ID: ${projectId}`);
    console.log(`✓ No spaces: ${!/\s/.test(projectId) ? '✅' : '❌'}`);
    console.groupEnd();
  }

  console.log('');
  console.log('💡 TIPS FOR FIXING "auth/invalid-api-key":');
  console.log('1. Ensure .env file exists in frontend/ directory');
  console.log('2. All variable names must start with VITE_');
  console.log('3. Verify API Key starts with "AIza"');
  console.log('4. Check Project ID and Auth Domain match Firebase Console');
  console.log('5. Restart dev server after changing .env (crucial!)');
  console.log('6. Check .env is not .env.local or .env.development');

  console.groupEnd();
};

/**
 * Validate Firebase config completely
 * Throws error if validation fails
 */
export const validateFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const errors = [];

  // Validate API Key
  if (!config.apiKey) {
    errors.push('VITE_FIREBASE_API_KEY is missing');
  } else if (!config.apiKey.startsWith('AIza')) {
    errors.push('VITE_FIREBASE_API_KEY should start with "AIza"');
  } else if (config.apiKey.length < 30) {
    errors.push('VITE_FIREBASE_API_KEY seems too short');
  }

  // Validate Auth Domain
  if (!config.authDomain) {
    errors.push('VITE_FIREBASE_AUTH_DOMAIN is missing');
  } else if (!config.authDomain.includes('.')) {
    errors.push('VITE_FIREBASE_AUTH_DOMAIN should be in format: project-id.firebaseapp.com');
  }

  // Validate Project ID
  if (!config.projectId) {
    errors.push('VITE_FIREBASE_PROJECT_ID is missing');
  } else if (config.projectId.includes(' ')) {
    errors.push('VITE_FIREBASE_PROJECT_ID contains spaces');
  }

  // Validate Storage Bucket
  if (!config.storageBucket) {
    errors.push('VITE_FIREBASE_STORAGE_BUCKET is missing');
  }

  // Validate Messaging Sender ID
  if (!config.messagingSenderId) {
    errors.push('VITE_FIREBASE_MESSAGING_SENDER_ID is missing');
  }

  // Validate App ID
  if (!config.appId) {
    errors.push('VITE_FIREBASE_APP_ID is missing');
  }

  if (errors.length > 0) {
    console.error('❌ Firebase Configuration Errors:');
    errors.forEach((err, i) => {
      console.error(`  ${i + 1}. ${err}`);
    });
    throw new Error(`Firebase config validation failed: ${errors.join('; ')}`);
  }

  return true;
};
