"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  User,
  FileText,
  Brain,
  Users,
  Activity,
  Globe,
  Target,
  Edit,
  Download,
  Calendar,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Dados mockados - em produção viriam do banco de dados
const planosEvolutivos = [
  {
    id: 1,
    paciente: "Maria Santos Silva",
    profissional: "Dra. Ana Costa",
    data: "2024-01-15",
    diagnosticoFuncional:
      "Criança de 8 anos com dificuldades na comunicação verbal e interação social. Apresenta limitações significativas na expressão oral, com vocabulário reduzido para a idade. Demonstra interesse em atividades lúdicas, mas tem dificuldade em manter atenção por períodos prolongados. Coordenação motora fina adequada para atividades de vida diária básicas.",
    status: "ativo",
    ultimaAtualizacao: "2024-01-15",
    funcoesCorpo: ["b117", "b122", "b140", "b152", "b167"],
    observacoesFuncoes:
      "Funções intelectuais preservadas, porém com dificuldades específicas na linguagem expressiva. Funções emocionais estáveis, com episódios ocasionais de frustração relacionados às dificuldades comunicativas.",
    estruturasCorporais: ["s110", "s320", "s330"],
    observacoesEstruturas:
      "Estruturas neurológicas e orofaciais sem alterações anatômicas significativas. Desenvolvimento típico das estruturas relacionadas à fala.",
    atividadesParticipacao: ["d140", "d145", "d160", "d166", "d310", "d330", "d350"],
    observacoesAtividades:
      "Dificuldades significativas em atividades de leitura e escrita. Comunicação receptiva preservada, mas expressiva limitada. Participação social reduzida devido às barreiras comunicativas.",
    fatoresFacilitadores: ["e310", "e355", "e125"],
    fatoresBarreiras: ["e460", "e325"],
    observacoesFatores:
      "Família muito colaborativa e presente no processo terapêutico. Profissionais especializados disponíveis. Algumas atitudes sociais ainda representam barreiras para inclusão completa.",
    objetivos: [
      {
        area: "Comunicação",
        objetivo: "Ampliar vocabulário expressivo em 50% e melhorar estruturação de frases simples",
        estrategia:
          "Terapia fonoaudiológica intensiva com uso de recursos visuais, jogos interativos e atividades lúdicas direcionadas",
        prazo: "6 meses",
      },
      {
        area: "Interação Social",
        objetivo: "Desenvolver habilidades de interação com pares em ambiente estruturado",
        estrategia: "Atividades em grupo pequeno, role-play, e treinamento de habilidades sociais específicas",
        prazo: "4 meses",
      },
      {
        area: "Atenção e Concentração",
        objetivo: "Aumentar tempo de atenção sustentada para 15 minutos em atividades dirigidas",
        estrategia: "Técnicas de modificação comportamental, uso de reforçadores positivos e atividades graduais",
        prazo: "3 meses",
      },
    ],
  },
]

const funcoesCorpoMap = {
  b110: "Funções da consciência",
  b117: "Funções intelectuais",
  b122: "Funções psicossociais globais",
  b130: "Funções da energia e dos impulsos",
  b134: "Funções do sono",
  b140: "Funções da atenção",
  b144: "Funções da memória",
  b147: "Funções psicomotoras",
  b152: "Funções emocionais",
  b156: "Funções da percepção",
  b167: "Funções mentais da linguagem",
  b172: "Funções de cálculo",
}

const estruturasCorporaisMap = {
  s110: "Estrutura do cérebro",
  s120: "Medula espinhal e estruturas relacionadas",
  s230: "Estruturas ao redor do olho",
  s240: "Estrutura do ouvido externo",
  s250: "Estrutura do ouvido médio",
  s260: "Estrutura do ouvido interno",
  s320: "Estrutura da boca",
  s330: "Estrutura da faringe",
  s710: "Estrutura da região da cabeça e do pescoço",
  s720: "Estrutura da região do ombro",
  s730: "Estrutura do membro superior",
  s750: "Estrutura do membro inferior",
}

const atividadesParticipacaoMap = {
  d110: "Observar",
  d115: "Ouvir",
  d130: "Imitar",
  d135: "Ensaiar",
  d140: "Aprender a ler",
  d145: "Aprender a escrever",
  d150: "Aprender a calcular",
  d155: "Adquirir habilidades",
  d160: "Concentrar a atenção",
  d163: "Pensar",
  d166: "Ler",
  d170: "Escrever",
  d172: "Calcular",
  d175: "Resolver problemas",
  d177: "Tomar decisões",
  d210: "Realizar uma única tarefa",
  d220: "Realizar tarefas múltiplas",
  d230: "Realizar a rotina diária",
  d240: "Lidar com o estresse",
  d310: "Comunicar-se - receber - mensagens faladas",
  d315: "Comunicar-se - receber - mensagens não verbais",
  d320: "Comunicar-se - receber - mensagens em linguagem de sinais",
  d325: "Comunicar-se - receber - mensagens escritas",
  d330: "Falar",
  d335: "Produzir mensagens não verbais",
  d350: "Conversação",
  d360: "Utilização de dispositivos e técnicas de comunicação",
  d410: "Mudar a posição básica do corpo",
  d415: "Manter a posição do corpo",
  d420: "Transferir a própria posição",
  d430: "Levantar e carregar objetos",
  d440: "Uso fino da mão",
  d445: "Uso da mão e do braço",
  d450: "Andar",
  d455: "Deslocar-se",
  d460: "Deslocar-se por diferentes locais",
  d470: "Utilização de transporte",
  d510: "Lavar-se",
  d520: "Cuidar de partes do corpo",
  d530: "Cuidados relacionados aos processos de excreção",
  d540: "Vestir-se",
  d550: "Comer",
  d560: "Beber",
  d570: "Cuidar da própria saúde",
}

const fatoresAmbientaisMap = {
  e110: "Produtos ou substâncias para consumo pessoal",
  e115: "Produtos e tecnologias para uso pessoal na vida diária",
  e120: "Produtos e tecnologias para mobilidade e transporte pessoal",
  e125: "Produtos e tecnologias para comunicação",
  e130: "Produtos e tecnologias para educação",
  e135: "Produtos e tecnologias para o trabalho",
  e140: "Produtos e tecnologias para cultura, recreação e esporte",
  e150: "Produtos e tecnologias usados em projeto, arquitetura e construção",
  e310: "Família imediata",
  e315: "Família ampliada",
  e320: "Amigos",
  e325: "Conhecidos, companheiros, colegas, vizinhos e membros da comunidade",
  e330: "Pessoas em posição de autoridade",
  e340: "Prestadores de cuidados pessoais e assistentes pessoais",
  e355: "Profissionais da saúde",
  e360: "Outros profissionais",
  e410: "Atitudes individuais de membros da família imediata",
  e420: "Atitudes individuais de amigos",
  e425: "Atitudes individuais de conhecidos, companheiros, colegas, vizinhos",
  e430: "Atitudes individuais de pessoas em posição de autoridade",
  e440: "Atitudes individuais de prestadores de cuidados pessoais",
  e450: "Atitudes individuais de profissionais da saúde",
  e460: "Atitudes sociais",
  e465: "Normas, práticas e ideologias sociais",
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    ativo: {
      label: "Ativo",
      className: "bg-primary-medium-green text-white",
    },
    encerrado: {
      label: "Encerrado",
      className: "bg-support-dark-purple text-white",
    },
    suspenso: {
      label: "Suspenso",
      className: "bg-secondary-orange text-white",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]
  return <Badge className={config.className}>{config.label}</Badge>
}

export default function VisualizarPlanoEvolutivo() {
  const params = useParams()
  const [plano, setPlano] = useState<any>(null)

  useEffect(() => {
    // Em produção, aqui faria a busca no banco de dados
    const planoEncontrado = planosEvolutivos.find((p) => p.id.toString() === params.id)
    setPlano(planoEncontrado)
  }, [params.id])

  if (!plano) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Plano evolutivo não encontrado</p>
          <Link href="/plano-evolutivo">
            <Button variant="outline" className="mt-4 bg-transparent">
              Voltar à lista
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/plano-evolutivo">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">Plano Evolutivo</h2>
          <p className="text-muted-foreground">Visualização detalhada do plano evolutivo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Cabeçalho do Plano */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-primary-teal" />
              <div>
                <CardTitle className="text-xl">{plano.paciente}</CardTitle>
                <p className="text-muted-foreground">Profissional: {plano.profissional}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              {getStatusBadge(plano.status)}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Elaborado em: {new Date(plano.data).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Atualizado em: {new Date(plano.ultimaAtualizacao).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Diagnóstico Funcional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Diagnóstico Funcional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-support-light-gray rounded-lg">
            <p className="text-gray-700 leading-relaxed">{plano.diagnosticoFuncional}</p>
          </div>
        </CardContent>
      </Card>

      {/* Funções do Corpo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Funções do Corpo (Códigos bXXX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {plano.funcoesCorpo.map((codigo: string) => (
                <div key={codigo} className="flex items-center gap-2 p-2 bg-support-off-white rounded">
                  <Badge variant="outline" className="font-mono text-xs">
                    {codigo}
                  </Badge>
                  <span className="text-sm">{funcoesCorpoMap[codigo as keyof typeof funcoesCorpoMap]}</span>
                </div>
              ))}
            </div>
            {plano.observacoesFuncoes && (
              <div className="p-4 bg-support-light-gray rounded-lg">
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-gray-700">{plano.observacoesFuncoes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estruturas Corporais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estruturas Corporais (Códigos sXXX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {plano.estruturasCorporais.map((codigo: string) => (
                <div key={codigo} className="flex items-center gap-2 p-2 bg-support-off-white rounded">
                  <Badge variant="outline" className="font-mono text-xs">
                    {codigo}
                  </Badge>
                  <span className="text-sm">
                    {estruturasCorporaisMap[codigo as keyof typeof estruturasCorporaisMap]}
                  </span>
                </div>
              ))}
            </div>
            {plano.observacoesEstruturas && (
              <div className="p-4 bg-support-light-gray rounded-lg">
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-gray-700">{plano.observacoesEstruturas}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atividades e Participação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades e Participação (Códigos dXXX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-2">
              {plano.atividadesParticipacao.map((codigo: string) => (
                <div key={codigo} className="flex items-center gap-2 p-2 bg-support-off-white rounded">
                  <Badge variant="outline" className="font-mono text-xs">
                    {codigo}
                  </Badge>
                  <span className="text-sm">
                    {atividadesParticipacaoMap[codigo as keyof typeof atividadesParticipacaoMap]}
                  </span>
                </div>
              ))}
            </div>
            {plano.observacoesAtividades && (
              <div className="p-4 bg-support-light-gray rounded-lg">
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-gray-700">{plano.observacoesAtividades}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fatores Ambientais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Fatores Ambientais (Códigos eXXX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {plano.fatoresFacilitadores.length > 0 && (
              <div>
                <h4 className="font-medium text-primary-medium-green mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-medium-green rounded-full"></div>
                  Facilitadores (Fatores Positivos)
                </h4>
                <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-2">
                  {plano.fatoresFacilitadores.map((codigo: string) => (
                    <div
                      key={codigo}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded border-l-4 border-primary-medium-green"
                    >
                      <Badge variant="outline" className="font-mono text-xs bg-white">
                        {codigo}
                      </Badge>
                      <span className="text-sm">
                        {fatoresAmbientaisMap[codigo as keyof typeof fatoresAmbientaisMap]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plano.fatoresBarreiras.length > 0 && (
              <div>
                <h4 className="font-medium text-secondary-red mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary-red rounded-full"></div>
                  Barreiras (Fatores Negativos)
                </h4>
                <div className="grid gap-2 md:grid-cols-1 lg:grid-cols-2">
                  {plano.fatoresBarreiras.map((codigo: string) => (
                    <div
                      key={codigo}
                      className="flex items-center gap-2 p-2 bg-red-50 rounded border-l-4 border-secondary-red"
                    >
                      <Badge variant="outline" className="font-mono text-xs bg-white">
                        {codigo}
                      </Badge>
                      <span className="text-sm">
                        {fatoresAmbientaisMap[codigo as keyof typeof fatoresAmbientaisMap]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plano.observacoesFatores && (
              <div className="p-4 bg-support-light-gray rounded-lg">
                <h4 className="font-medium mb-2">Observações sobre Fatores Ambientais</h4>
                <p className="text-gray-700">{plano.observacoesFatores}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Objetivos Terapêuticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos Terapêuticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plano.objetivos.map((objetivo: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg bg-support-off-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary-dark-blue">Objetivo {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary-teal text-white">
                      {objetivo.area}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary-orange text-white">
                      {objetivo.prazo}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm text-gray-600 mb-1">Objetivo:</h5>
                    <p className="text-gray-700">{objetivo.objetivo}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-600 mb-1">Estratégia:</h5>
                    <p className="text-gray-700">{objetivo.estrategia}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rodapé com informações do documento */}
      <Card className="bg-support-light-gray">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Plano Evolutivo baseado na Classificação Internacional de Funcionalidade, Incapacidade e Saúde (CIF)</p>
            <p className="mt-1">
              Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
