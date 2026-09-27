/**
 * Modelos Oficiais de Folhetos Publicitários & Comunicados da ZATY ACADEMY
 * Cada modelo possui um layout visual, arquitetura de informação e distribuição gráfica completamente distintos:
 * 
 * 1. 'enrollment' - Inscrições Abertas (Admissões, fotos de laboratório, grelha 2x2, turnos e QR code)
 * 2. 'courses'    - Divulgação de Cursos (Catálogo curricular detalhado em faixas horizontais com módulos e competências)
 * 3. 'workshop'   - Workshops & Bootcamps (Imersão intensiva de fim-de-semana, estética dark tech e 3 formações práticas)
 * 4. 'campaign'   - Campanhas & Descontos (Ofertas promocionais com selos de desconto, pacotes combinados e urgência comercial)
 * 5. 'event'      - Eventos & Seminários (Jornada tecnológica, portas abertas com agenda cronológica e credenciamento)
 * 6. 'notice'     - Comunicado Oficial (Diretiva formal administrativa em formato de despacho com artigos e assinaturas)
 */

export const FLYER_MODELS = [
  {
    id: 'enrollment',
    name: 'Inscrições Abertas',
    tagline: 'Admissões & Novas Turmas',
    badgeText: 'Matrículas 2026',
    accentColor: '#0072B5',
    defaultTitle: '📢 INSCRIÇÕES ABERTAS - ANO FORMATIVO 2026',
    defaultSubtitle: 'Garanta a sua vaga em cursos 100% práticos com 1 computador por formando',
    defaultBadge: 'VAGAS LIMITADAS',
    defaultTag: 'Ano Formativo 2026',
    description: 'Composição com fotos em ação no laboratório, faixas de vagas limitadas, grelha 2x2 de cursos principais, turnos e chamada direta para inscrição online com QR Code.'
  },
  {
    id: 'courses',
    name: 'Divulgação de Cursos',
    tagline: 'Catálogo de Especializações',
    badgeText: 'Grade Curricular',
    accentColor: '#0284C7',
    defaultTitle: '🚀 CATÁLOGO DE CURSOS PROFISSIONAIS EM TI',
    defaultSubtitle: 'Conheça o programa curricular detalhado e as competências práticas desenvolvidas',
    defaultBadge: 'FORMAÇÃO PRÁTICA',
    defaultTag: 'Catálogo Oficial',
    description: 'Layout em faixas horizontais sequenciais dos 4 cursos com ementa de módulos práticos (Word/Excel, Photoshop/Illustrator, Hardware/Redes, Web/JS), competências e saídas profissionais.'
  },
  {
    id: 'workshop',
    name: 'Workshops & Bootcamps',
    tagline: 'Imersão Prática Intensiva',
    badgeText: 'Intensivo Fim-de-Semana',
    accentColor: '#00C7FD',
    defaultTitle: '⚡ ZATY TECH BOOTCAMP // MASTERCLASS INTENSIVA',
    defaultSubtitle: 'Imersão prática acelerada com projetos reais para o mercado de trabalho',
    defaultBadge: '15 VAGAS / TURMA',
    defaultTag: 'Fins-de-Semana',
    description: 'Estrutura de alta energia com foco em cursos intensivos de fim-de-semana, 3 módulos focados em projetos reais, mentoria direta e turmas reduzidas a 15 vagas.'
  },
  {
    id: 'campaign',
    name: 'Campanhas & Descontos',
    tagline: 'Ofertas Promocionais',
    badgeText: 'Desconto Especial',
    accentColor: '#DC2626',
    defaultTitle: '🔥 CAMPANHA ESPECIAL DE CAPACITAÇÃO 2026',
    defaultSubtitle: 'Descontos imperdíveis na matrícula e pacotes promocionais para novos formandos',
    defaultBadge: 'ATÉ 25% DESCONTO',
    defaultTag: 'Tempo Limitado',
    description: 'Composição de alta conversão comercial com selos circulares de desconto, tabela comparativa de pacotes promocionais, urgência temporal e link rápido para WhatsApp.'
  },
  {
    id: 'event',
    name: 'Eventos & Seminários',
    tagline: 'Palestras & Portas Abertas',
    badgeText: 'Entrada Livre',
    accentColor: '#7C3AED',
    defaultTitle: '🎯 JORNADA TECNOLÓGICA & PORTAS ABERTAS',
    defaultSubtitle: 'O Futuro da Tecnologia em Moçambique: Carreiras em TI, IA e Inovação Digital',
    defaultBadge: 'ENTRADA LIVRE',
    defaultTag: 'Auditório Zaty Academy',
    description: 'Layout estruturado em torno da agenda cronológica do evento (Data, Hora, Local), cronograma detalhado de sessões/painéis e confirmação de presença com credenciamento.'
  },
  {
    id: 'notice',
    name: 'Comunicado Oficial',
    tagline: 'Diretiva & Aviso Académico',
    badgeText: 'Secretaria Geral',
    accentColor: '#0F172A',
    defaultTitle: '📋 COMUNICADO OFICIAL DA DIREÇÃO ACADÉMICA',
    defaultSubtitle: 'Disposições gerais sobre calendário letivo, normas e funcionamento institucional',
    defaultBadge: 'DESPACHO OFICIAL',
    defaultTag: 'Secretaria Geral',
    description: 'Layout formal e institucional em formato de Despacho/Comunicado Administrativo, com número de referência, artigos numerados, carimbo e bloco de assinatura da Direção.'
  }
];

export function getFlyerModel(modelId) {
  return FLYER_MODELS.find(m => m.id === modelId) || FLYER_MODELS[0];
}

// Compatibilidade retroativa para templates legados
export const FLYER_TEMPLATES = FLYER_MODELS;
export const FLYER_PURPOSES = FLYER_MODELS;
export function getFlyerTemplate(id) { return getFlyerModel(id); }
export function getFlyerPurpose(id) { return getFlyerModel(id); }
