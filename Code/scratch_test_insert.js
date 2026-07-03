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
    const dummyRequestId = '04d5318d-5ab2-4652-a5c6-a47632ba7a03'; // from logs or any valid/invalid UUID
    const dummyProviderId = '5fd1d508-e925-49f0-b0ca-1e38d3eb367b';

    const insertPayload = {
      request_id: dummyRequestId,
      provider_id: dummyProviderId,
      scheduled_time: new Date().toISOString(),
      status: 'scheduled',
      scheduled_for: new Date().toISOString(),
      is_future_booking: true,
      user_lat: 31.5204,
      user_lng: 74.3587,
      provider_lat: 31.5354,
      provider_lng: 74.3737,
      eta_minutes: 15,
      travel_status: JSON.stringify({ last_seen: new Date().toISOString(), device_status: "active", network_status: "online" })
    };

    console.log("TESTING PAYLOAD:", insertPayload);

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.log("Supabase Error Details:");
      console.log("message:", error.message);
      console.log("details:", error.details);
      console.log("hint:", error.hint);
      console.log("code:", error.code);
      console.log("full error:", error);
    } else {
      console.log("Success:", booking);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}
main();
