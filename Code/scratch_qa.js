const fs = require('fs');

async function runQA() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

  if (!urlMatch || !keyMatch) {
    console.error("Missing environment keys in .env.local");
    return;
  }

  const SUPABASE_URL = urlMatch[1].trim();
  const SUPABASE_KEY = keyMatch[1].trim();

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  try {
    // 1. Fetch Profiles
    const pRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers });
    const profiles = await pRes.json();
    console.log("\n--- PROFILES ---");
    console.log(profiles.map(p => ({ id: p.id, role: p.role, email: p.email, name: p.full_name })));

    // 2. Fetch Providers
    const prRes = await fetch(`${SUPABASE_URL}/rest/v1/providers?select=*`, { headers });
    const providers = await prRes.json();
    console.log("\n--- PROVIDERS ---");
    console.log(providers.map(p => ({ id: p.id, user_id: p.user_id, service: p.service_type })));

    // 3. Fetch Bookings
    const bRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, { headers });
    const bookings = await bRes.json();
    console.log("\n--- BOOKINGS ---");
    console.log(bookings.map(b => ({ id: b.id, provider_id: b.provider_id, status: b.status, tech_status: b.technician_status })));

    // 4. Fetch Requests
    const rRes = await fetch(`${SUPABASE_URL}/rest/v1/requests?select=*`, { headers });
    const requests = await rRes.json();
    console.log("\n--- REQUESTS ---");
    console.log(requests.map(r => ({ id: r.id, user_id: r.user_id, status: r.status, service: r.service })));

  } catch (err) {
    console.error("Failed to run QA:", err);
  }
}

runQA();
