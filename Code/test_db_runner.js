const supabaseUrl = 'https://evzugkcizudpxkbtewox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4';

async function runTest() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'TempPassword123!';
    
    console.log("Signing up temporary user via REST:", email);
    const authRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!authRes.ok) {
      throw new Error("REST Signup failed: " + await authRes.text());
    }
    
    const authData = await authRes.json();
    const token = authData.access_token;
    const userId = authData.user.id;
    console.log("REST Signup success! User ID:", userId);

    // Create profile
    console.log("Creating user profile...");
    const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        role: 'resident',
        full_name: 'Test User',
        phone: '03001234567'
      })
    });

    if (!profRes.ok) {
      throw new Error("REST Profile creation failed: " + await profRes.text());
    }
    console.log("Profile created successfully!");

    // Create a temporary request
    console.log("Creating test request...");
    const reqRes = await fetch(`${supabaseUrl}/rest/v1/requests`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        service: 'Bike Mechanic',
        location: 'G10',
        raw_input: 'Test Request',
        status: 'pending'
      })
    });

    if (!reqRes.ok) {
      throw new Error("REST Request creation failed: " + await reqRes.text());
    }
    
    const request = (await reqRes.json())[0];
    console.log("Created test request with ID:", request.id);

    // Test: Insert with both 'action', 'message', 'status'
    console.log("Testing trace insert with BOTH action and message/status...");
    const traceRes = await fetch(`${supabaseUrl}/rest/v1/traces`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        request_id: request.id,
        agent: 'TEST_AGENT',
        action: 'testing action',
        message: 'testing message',
        status: 'success'
      })
    });

    const body = await traceRes.text();
    console.log("Hybrid insert status:", traceRes.status, body);
    
  } catch (err) {
    console.error("Test encountered exception:", err.message);
  }
}

runTest();
