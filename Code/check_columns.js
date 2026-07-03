async function main() {
  const urlBase = "https://evzugkcizudpxkbtewox.supabase.co/rest/v1";
  const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4"
  };

  try {
    const oRes = await fetch(`${urlBase}/orchestration_sessions?limit=1`, { headers });
    const text = await oRes.text();
    console.log("Response text:", text);
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
      } else if (typeof data === 'object') {
        console.log("Columns:", Object.keys(data));
      }
    } catch(err) {
      console.log("Not JSON:", text);
    }
  } catch (e) {
    console.error("orchestration_sessions columns request failed:", e);
  }
}
main();
