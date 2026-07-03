const fs = require('fs');

async function runDeduplication() {
  console.log("=== AETHERFLOW DATABASE AUDIT & DEDUPLICATION ===");
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
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch Bookings
    console.log("\n1. Auditing bookings...");
    const bRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, { headers });
    if (!bRes.ok) throw new Error("Failed to fetch bookings: " + await bRes.text());
    const bookings = await bRes.json();
    console.log(`Total Bookings: ${bookings.length}`);

    // Map of request_id to list of bookings
    const bookingGroups = {};
    bookings.forEach(b => {
      if (!bookingGroups[b.request_id]) {
        bookingGroups[b.request_id] = [];
      }
      bookingGroups[b.request_id].push(b);
    });

    let duplicateBookingsCount = 0;
    let deletedBookingsCount = 0;

    for (const requestId in bookingGroups) {
      const group = bookingGroups[requestId];
      if (group.length > 1) {
        duplicateBookingsCount += (group.length - 1);
        console.log(`Found duplicate bookings for Request: ${requestId} (${group.length} rows)`);

        // Sort group by created_at descending or by ID to find the newest.
        // We'll keep the last one in the array as the newest, or sort by id or status.
        // If they have created_at, let's use it, otherwise sort by ID.
        group.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA; // Newest first
        });

        const newestBooking = group[0];
        const oldDuplicates = group.slice(1);

        console.log(`Keeping newest booking ID: ${newestBooking.id}`);
        for (const oldBooking of oldDuplicates) {
          console.log(`Deleting duplicate booking ID: ${oldBooking.id}`);
          const delRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${oldBooking.id}`, {
            method: 'DELETE',
            headers
          });
          if (delRes.ok) deletedBookingsCount++;
        }
      }
    }

    console.log(`Duplicates Handled: Found ${duplicateBookingsCount}, Deleted ${deletedBookingsCount}`);

    // 2. Fetch Traces
    console.log("\n2. Auditing traces...");
    const tRes = await fetch(`${SUPABASE_URL}/rest/v1/traces?select=*`, { headers });
    if (!tRes.ok) throw new Error("Failed to fetch traces: " + await tRes.text());
    const traces = await tRes.json();
    console.log(`Total Traces: ${traces.length}`);

    // Group traces by request_id + agent + action to find duplicates
    const traceGroups = {};
    traces.forEach(t => {
      const key = `${t.request_id}_${t.agent}_${t.action}`;
      if (!traceGroups[key]) {
        traceGroups[key] = [];
      }
      traceGroups[key].push(t);
    });

    let duplicateTracesCount = 0;
    let deletedTracesCount = 0;

    for (const key in traceGroups) {
      const group = traceGroups[key];
      if (group.length > 1) {
        duplicateTracesCount += (group.length - 1);
        
        group.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeB - timeA; // Newest first
        });

        const newestTrace = group[0];
        const oldDuplicates = group.slice(1);

        for (const oldTrace of oldDuplicates) {
          const delRes = await fetch(`${SUPABASE_URL}/rest/v1/traces?id=eq.${oldTrace.id}`, {
            method: 'DELETE',
            headers
          });
          if (delRes.ok) deletedTracesCount++;
        }
      }
    }
    console.log(`Duplicate Traces Handled: Found ${duplicateTracesCount}, Deleted ${deletedTracesCount}`);

    // 3. Fetch requests to validate session reference
    const rRes = await fetch(`${SUPABASE_URL}/rest/v1/requests?select=id`, { headers });
    const requests = await rRes.json();
    const existingRequestIds = new Set(requests.map(r => r.id));

    // 4. Fetch Orchestration Sessions
    console.log("\n3. Auditing orchestration sessions...");
    const sRes = await fetch(`${SUPABASE_URL}/rest/v1/orchestration_sessions?select=*`, { headers });
    let deletedSessionsCount = 0;

    if (sRes.ok) {
      const sessions = await sRes.json();
      console.log(`Total Orchestration Sessions: ${sessions.length}`);

      const validStages = new Set(['INTENT', 'LOCATION', 'PROVIDER', 'RANKING', 'BOOKING', 'ASSIGNMENT', 'TRACE']);

      for (const session of sessions) {
        let isInvalid = false;
        let reason = "";

        // booking_id is NULL while status is completed or stage is finalized
        if (!session.booking_id && (session.status === 'COMPLETED' || session.current_stage === 'TRACE')) {
          isInvalid = true;
          reason = "Completed stage but booking_id is null";
        }
        
        // Invalid current stage
        if (session.current_stage && !validStages.has(session.current_stage.toUpperCase())) {
          isInvalid = true;
          reason = `Invalid stage: ${session.current_stage}`;
        }

        // Missing original request reference
        if (session.request_id && !existingRequestIds.has(session.request_id)) {
          isInvalid = true;
          reason = "Original request ID does not exist";
        }

        if (isInvalid) {
          console.log(`Deleting invalid session for request ${session.request_id}. Reason: ${reason}`);
          const delRes = await fetch(`${SUPABASE_URL}/rest/v1/orchestration_sessions?request_id=eq.${session.request_id}`, {
            method: 'DELETE',
            headers
          });
          if (delRes.ok) deletedSessionsCount++;
        }
      }
    } else {
      console.log("No orchestration_sessions table or unable to fetch.");
    }
    console.log(`Invalid Orchestration Sessions Cleared: ${deletedSessionsCount}`);

    console.log("\n=== DATABASE AUDIT COMPLETED SUCCESSFULLY ===");

  } catch (err) {
    console.error("Deduplication error encountered:", err);
  }
}

runDeduplication();
