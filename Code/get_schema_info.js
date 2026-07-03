const urlBase = "https://evzugkcizudpxkbtewox.supabase.co/rest/v1";
const headers = {
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4"
};

async function main() {
  try {
    const res = await fetch(`${urlBase}/`, { headers });
    const schema = await res.json();
    console.log(schema);
  } catch (e) {
    console.error("Failed to query schema:", e);
  }
}
main();
