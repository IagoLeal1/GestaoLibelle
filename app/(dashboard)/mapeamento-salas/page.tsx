import { RoomsClientPage } from "@/components/pages/rooms-client-page";

export default function SalasPage() {
  // O AuthGuard no layout já protege esta rota.
  return <RoomsClientPage />;
}