import { SessionKeepAlive } from "@/components/SessionKeepAlive";

export default function PoliticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionKeepAlive />
      {children}
    </>
  );
}
