const urlBase = "https://evzugkcizudpxkbtewox.supabase.co/rest/v1";
const headers = {
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enVna2NpenVkcHhrYnRld294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTIzMTUsImV4cCI6MjA5NDU2ODMxNX0.6w4um0xCeXgrNvDPnrn18YJSFkAYV9E9_uvcs6UTCf4",
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

async function main() {
  try {
    const res = await fetch(`${urlBase}/requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: "00000000-0000-0000-0000-000000000000",
        service: "Test",
        image_url: "http://example.com/img.jpg"
      })
    });
    const text = await res.text();
    console.log("Insert result:", text);
  } catch (e) {
    console.error("Failed to test insert:", e);
  }
}
main();
