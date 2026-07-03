const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing environment keys");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('scheduled_for, is_future_booking')
      .limit(1);
    
    if (error) {
      console.log("Columns missing or query error:", error.message);
    } else {
      console.log("Success! Columns exist in bookings table.");
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}
main();
