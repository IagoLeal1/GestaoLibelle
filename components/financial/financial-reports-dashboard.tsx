// components/financial/financial-reports-dashboard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download, FileText, Calendar, AlertTriangle, Building2, BarChart3, 
    CreditCard, TrendingUp, Target, Activity, LineChart, Eye, Flag
} from "lucide-react";
import { ReportType } from "./financial-report-modal";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  actionText: string;
  actionIcon: React.ElementType;
  onClick: () => void;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

const ReportCard = ({ title, description, icon: Icon, iconColor, actionText, actionIcon: ActionIcon, onClick, badgeText, badgeVariant }: ReportCardProps) => (
  <Card className="hover:shadow-lg transition-shadow flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        {title}
        {badgeText && <Badge variant={badgeVariant || 'destructive'} className="ml-auto">{badgeText}</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col flex-grow">
      <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
      <Button onClick={onClick} className="w-full mt-auto bg-transparent" variant="outline">
        <ActionIcon className="mr-2 h-4 w-4" />
        {actionText}
      </Button>
    </CardContent>
  </Card>
);

interface FinancialReportsDashboardProps {
  onGenerateReport: (type: ReportType) => void;
  onOpenVisualizer: (type: ReportType) => void;
}

export function FinancialReportsDashboard({ onGenerateReport, onOpenVisualizer }: FinancialReportsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Relatórios de Exportação */}
        <ReportCard 
          title="Contas Pagas" description="Relatório detalhado de todas as contas que foram pagas no período selecionado."
          icon={FileText} iconColor="text-primary-medium-green" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => onGenerateReport('despesas')} // Reutiliza o tipo 'despesas' mas filtraremos por status 'pago'
        />
        <ReportCard 
          title="Contas Recebidas" description="Relatório detalhado de todas as contas que foram recebidas no período selecionado."
          icon={FileText} iconColor="text-primary-teal" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => onGenerateReport('receitas')} // Reutiliza o tipo 'receitas' mas filtraremos por status 'pago'
        />
        <ReportCard 
          title="Contas a Pagar" description="Relatório de contas pendentes de pagamento com vencimentos e valores."
          icon={Calendar} iconColor="text-secondary-orange" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => onGenerateReport('contas_a_pagar')}
        />
        <ReportCard 
          title="Contas a Receber" description="Relatório de contas pendentes de recebimento com vencimentos e valores."
          icon={Calendar} iconColor="text-secondary-red" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => onGenerateReport('contas_a_receber')}
        />
        <ReportCard 
          title="Por Centro de Custo" description="Análise financeira detalhada por centro de custo e departamento."
          icon={Building2} iconColor="text-primary-dark-blue" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => onGenerateReport('despesas_por_centro_custo')}
        />
        <ReportCard 
          title="Por Banco" description="Movimentações financeiras agrupadas por instituição bancária."
          icon={CreditCard} iconColor="text-purple-600" actionText="Gerar Relatório" actionIcon={Download}
          onClick={() => alert("Funcionalidade em desenvolvimento.")} // Futuro
        />
        <ReportCard 
          title="Controle de Inadimplência" description="Relatório de contas em atraso com alertas automáticos."
          icon={AlertTriangle} iconColor="text-secondary-red" actionText="Gerar Relatório" actionIcon={Download}
          badgeText="3 contas vencidas" // Exemplo estático
          onClick={() => alert("Funcionalidade em desenvolvimento.")} // Futuro
        />

        {/* Relatórios de Visualização */}
        <ReportCard 
          title="Fluxo de Caixa" description="Comparativo entre previsto x realizado com projeções mensais."
          icon={BarChart3} iconColor="text-primary-teal" actionText="Visualizar Fluxo" actionIcon={Eye}
          onClick={() => onOpenVisualizer('fluxo_caixa')}
        />
        <ReportCard 
          title="Previsões Futuras" description="Projeções trimestrais com cenários otimista, realista e pessimista."
          icon={TrendingUp} iconColor="text-purple-600" actionText="Ver Previsões" actionIcon={Eye}
          onClick={() => onOpenVisualizer('previsoes_futuras')}
        />
        <ReportCard 
          title="Metas Financeiras" description="Definição e acompanhamento de metas anuais e trimestrais."
          icon={Target} iconColor="text-amber-600" actionText="Gerenciar Metas" actionIcon={Flag}
          onClick={() => onOpenVisualizer('metas_financeiras')}
        />
        <ReportCard 
          title="Análise de Tendências" description="Indicadores de performance e tendências de crescimento."
          icon={Activity} iconColor="text-indigo-600" actionText="Ver Tendências" actionIcon={LineChart}
          onClick={() => onOpenVisualizer('analise_tendencias')}
        />
         <ReportCard 
          title="Comparativo Mensal" description="Análise comparativa de receitas e despesas por mês."
          icon={Target} iconColor="text-primary-medium-green" actionText="Ver Comparativo" actionIcon={BarChart3}
          onClick={() => onOpenVisualizer('comparativo_mensal')}
        />

      </div>
    </div>
  );
}