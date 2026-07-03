const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://andnbfqbdqeortyocmvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZG5iZnFiZHFlb3J0eW9jbXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM0MjQsImV4cCI6MjA5NTc2OTQyNH0.TYf_dy7SISkQ1Rf29jiAyRXO2KFLQBj09V4wxaR30zk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const email = `diagnostic_prov_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const { data: auth, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    
    const token = auth.session.access_token;
    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    console.log("Fetching one provider to inspect columns...");
    const { data: providers, error: pErr } = await authClient
      .from('providers')
      .select('*')
      .limit(1);
    if (pErr) throw pErr;
    if (providers.length > 0) {
      console.log("Providers columns:", Object.keys(providers[0]));
    } else {
      console.log("No providers found.");
    }

    console.log("Checking if provider_availability table exists...");
    const { data: avail, error: aErr } = await authClient
      .from('provider_availability')
      .select('*')
      .limit(1);
    if (aErr) {
      console.log("provider_availability check failed (probably does not exist):", aErr.message);
    } else {
      console.log("provider_availability exists! Columns:", Object.keys(avail[0] || {}));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
