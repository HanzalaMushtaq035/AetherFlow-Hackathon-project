const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://andnbfqbdqeortyocmvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZG5iZnFiZHFlb3J0eW9jbXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM0MjQsImV4cCI6MjA5NTc2OTQyNH0.TYf_dy7SISkQ1Rf29jiAyRXO2KFLQBj09V4wxaR30zk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const email = `diagnostic_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log("Signing up diagnostic user...");
    const { data: auth, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    
    const token = auth.session.access_token;
    console.log("User signed up. Authenticating client...");
    
    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    console.log("Fetching latest requests...");
    const { data: requests, error: rErr } = await authClient
      .from('requests')
      .select('*')
      .limit(10);
    if (rErr) throw rErr;
    console.log(`Found ${requests.length} requests.`);
    console.log(JSON.stringify(requests, null, 2));

    console.log("Fetching all bookings...");
    const { data: bookings, error: bErr } = await authClient
      .from('bookings')
      .select('*')
      .limit(20);
    if (bErr) throw bErr;
    console.log(`Found ${bookings.length} bookings.`);
    console.log(JSON.stringify(bookings, null, 2));

    console.log("Fetching all orchestration_sessions...");
    const { data: sessions, error: sErr } = await authClient
      .from('orchestration_sessions')
      .select('*')
      .limit(20);
    if (sErr) throw sErr;
    console.log(`Found ${sessions.length} orchestration sessions.`);
    console.log(JSON.stringify(sessions, null, 2));

  } catch (err) {
    console.error("Error executing diagnostics:", err.message);
  }
}

main();
