import IncidentDetailClient from "./IncidentDetailClient";

export function generateStaticParams() {
  return [
    { id: "inc-001" },
    { id: "inc-002" },
    { id: "inc-003" },
  ];
}

export default function IncidentPage() {
  return <IncidentDetailClient />;
}
