// src/app/financeiro/page.tsx
import FinancialClientPage from "@/components/pages/financial-client-page";

export default function FinanceiroPage() {
  return (
    <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
      <FinancialClientPage />
    </main>
  );
}