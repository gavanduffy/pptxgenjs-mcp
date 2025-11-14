#!/usr/bin/env node

/**
 * Simple R2 Connectivity Test
 * Tests basic connectivity to the R2 bucket endpoint
 */

const PUBLIC_BUCKET_URL = process.env.PUBLIC_BUCKET_URL || 'https://r2.euan.live';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '4f87e5f45d2de0de6a82205308cce3f3';

console.log('🔍 Testing R2 Connectivity\n');
console.log(`📍 Bucket URL: ${PUBLIC_BUCKET_URL}`);
console.log(`🆔 Account ID: ${CLOUDFLARE_ACCOUNT_ID}\n`);

// Test 1: Check if endpoint is accessible
console.log('=== Test 1: Check Endpoint Accessibility ===');
fetch(PUBLIC_BUCKET_URL)
  .then(async response => {
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers));
    
    // Try to read body
    const text = await response.text();
    if (text && text.length < 500) {
      console.log(`📄 Response body preview: ${text.substring(0, 200)}...\n`);
    } else {
      console.log(`📄 Response body size: ${text.length} bytes\n`);
    }
  })
  .catch(error => {
    console.log(`❌ Endpoint not accessible: ${error.message}\n`);
  })
  .then(() => {
    // Test 2: Try uploading a small test file
    console.log('=== Test 2: Test Upload (Small Test File) ===');
    
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for R2 connectivity';
    const testUrl = `${PUBLIC_BUCKET_URL}/${testFileName}`;
    
    console.log(`📤 Attempting upload to: ${testUrl}`);
    
    return fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: testContent,
    })
      .then(async response => {
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`✅ Upload successful!`);
          console.log(`🔗 File URL: ${testUrl}`);
          
          // Try to read it back
          return fetch(testUrl)
            .then(r => r.text())
            .then(text => {
              console.log(`✅ Read back successful: "${text}"`);
            });
        } else {
          const errorText = await response.text();
          console.log(`❌ Upload failed: ${errorText}`);
        }
      })
      .catch(error => {
        console.log(`❌ Upload error: ${error.message}`);
        console.log(`\n💡 Note: This is expected if R2 bucket requires authentication`);
        console.log(`   You may need to configure CORS or use signed URLs\n`);
      });
  })
  .then(() => {
    // Test 3: Check CORS headers
    console.log('\n=== Test 3: Check CORS Configuration ===');
    
    return fetch(PUBLIC_BUCKET_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'PUT',
      },
    })
      .then(response => {
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        const corsHeaders = {
          'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
          'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
          'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
        };
        
        console.log('CORS Headers:', corsHeaders);
        
        if (corsHeaders['Access-Control-Allow-Methods']?.includes('PUT')) {
          console.log('✅ CORS allows PUT requests');
        } else {
          console.log('⚠️  CORS may not allow PUT requests');
        }
      })
      .catch(error => {
        console.log(`⚠️  CORS check failed: ${error.message}`);
      });
  })
  .then(() => {
    console.log('\n✅ All connectivity tests completed!\n');
    console.log('📝 Summary:');
    console.log('  - If all tests passed, R2 bucket is publicly accessible');
    console.log('  - If uploads failed, you may need to configure:');
    console.log('    1. R2 bucket CORS settings to allow PUT');
    console.log('    2. Authentication/signed URLs for uploads');
    console.log('    3. Cloudflare Worker or API for secure uploads\n');
  })
  .catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
