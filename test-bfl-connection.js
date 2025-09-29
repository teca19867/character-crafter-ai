// BFL Connection Diagnostic Script
import fetch from 'node-fetch';

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('Please provide BFL API key: node test-bfl-connection.js YOUR_API_KEY');
  console.error('Note: Replace YOUR_API_KEY with your actual BFL API key');
  console.error('Get API key: https://api.bfl.ml/');
  process.exit(1);
}

async function testBFLConnection() {
  console.log('🧪 Starting BFL API connection diagnostic...');
  console.log('🔑 API key length:', API_KEY.length);
  
  try {
    // Test 1: Direct connection to BFL API
    console.log('\n📡 Test 1: Direct connection to BFL API');
    const directResponse = await fetch('https://api.bfl.ml/v1/flux-pro-1.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': API_KEY,
      },
      body: JSON.stringify({
        prompt: 'test image',
        width: 512,
        height: 512,
        safety_tolerance: 6,
        output_format: 'jpeg'
      }),
    });
    
    console.log('📊 Response status:', directResponse.status);
    console.log('📋 Response headers:', Object.fromEntries(directResponse.headers.entries()));
    
    const responseText = await directResponse.text();
    console.log('📄 Response content:', responseText);
    
    if (directResponse.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Direct connection successful! Task ID:', result.id);
      
      // Test 2: Connection through proxy
      console.log('\n📡 Test 2: Connection through proxy');
      const proxyResponse = await fetch('http://localhost:3001/test-bfl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: API_KEY }),
      });
      
      const proxyResult = await proxyResponse.json();
      console.log('📊 Proxy response:', proxyResult);
      
      if (proxyResult.success) {
        console.log('✅ Proxy connection also successful!');
      } else {
        console.log('❌ Proxy connection failed:', proxyResult.error);
      }
      
    } else {
      console.log('❌ Direct connection failed:', responseText);
    }
    
  } catch (error) {
    console.error('💥 Connection error:', error.message);
    console.error('🔍 Error code:', error.code);
    console.error('📋 Error details:', error);
  }
}

testBFLConnection();
