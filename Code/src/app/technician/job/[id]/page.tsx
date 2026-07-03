import TechnicianJobDetailsClient from "./JobDetailsClient";

export function generateStaticParams() {
  return Array.from(
    { length: 200 },
    (_, i) => ({
      id: `req_${String(i + 1).padStart(3, "0")}`
    })
  );
}

export default function Page() {
  return <TechnicianJobDetailsClient />;
}
