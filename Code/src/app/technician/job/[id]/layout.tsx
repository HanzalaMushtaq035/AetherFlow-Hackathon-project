export async function generateStaticParams() {
  return Array.from(
    { length: 200 },
    (_, i) => ({
      id: `req_${String(i + 1).padStart(3, "0")}`
    })
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
