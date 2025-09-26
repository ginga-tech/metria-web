// Shared constants for Assessment dimensions and Goal categories

export type DimensionKey =
  | "saude"
  | "conhecimento"
  | "disciplina"
  | "cultura"
  | "leitura"
  | "inteligenciaEmocional"
  | "relacionamentos"
  | "maturidadeProfissional"
  | "visaoDeMundo"
  | "dominioFinanceiro";

export interface DimensionDef {
  key: DimensionKey;
  label: string;
  tooltip: string;
}

export const DIMENSIONS: DimensionDef[] = [
  {
    key: "saude",
    label: "Saúde",
    tooltip:
      "Você já sabe o quanto cuidar da saúde é importante. Com peso, alimentação, exercícios físicos, sono e estresse equilibrados, você tem a energia necessária para conquistar seus objetivos e sonhos.",
  },
  {
    key: "conhecimento",
    label: "Conhecimento",
    tooltip:
      "Você tem uma boa bagagem técnica, com hard skills variadas e conhecimentos avançados. Isso permite que você tenha uma visão estratégica apurada, essencial para a boa tomada de decisão.",
  },
  {
    key: "disciplina",
    label: "Disciplina e Foco",
    tooltip:
      "A constância faz parte da sua vida. Com uma rotina diária bem estabelecida, organização e consistência nas atividades, você consegue fazer entregas de resultados impactando sua vida pessoal e profissional.",
  },
  {
    key: "cultura",
    label: "Cultura Geral",
    tooltip:
      "Possuir conhecimentos variados possibilita criar conexões com diferentes pessoas. Do interesse sobre economia até saber curiosidades sobre outros países e culturas, você se relaciona bem em qualquer ambiente.",
  },
  {
    key: "leitura",
    label: "Leitura",
    tooltip:
      "Você sabe a importância da leitura e leu vários livros nos últimos meses. Valorizar esse conhecimento adquirido permite que você alcance diferentes pessoas, lugares e oportunidades.",
  },
  {
    key: "inteligenciaEmocional",
    label: "Inteligência Emocional",
    tooltip:
      "Você consegue lidar com serenidade com as suas emoções, seja em situações de estresse ou adversidades. Sua maturidade emocional faz com que você tenha mais equilíbrio no dia a dia.",
  },
  {
    key: "relacionamentos",
    label: "Relacionamentos",
    tooltip:
      "Você tem a habilidade de criar e manter relacionamentos, seja no âmbito familiar, nas amizades, no trabalho ou até mesmo na sua rede de networking. Essa característica pode ser um diferencial para chegar mais longe.",
  },
  {
    key: "maturidadeProfissional",
    label: "Maturidade Profissional",
    tooltip:
      "Você tem exata noção das suas responsabilidades e domínio total do que faz. Por isso, sempre entrega além do que é pedido. Se bem trabalhadas, essas características podem provocar grandes melhorias na sua vida.",
  },
  {
    key: "visaoDeMundo",
    label: "Visão de Mundo",
    tooltip:
      "Suas noções gerais de economia, economia digital, tecnologia, geopolítica e atualidades proporcionam uma visão única sobre o mundo. Isso pode trazer oportunidades, facilitar networking e abrir portas profissionais.",
  },
  {
    key: "dominioFinanceiro",
    label: "Domínio Financeiro",
    tooltip:
      "Você tem uma boa relação com o dinheiro. Pode ser que ainda seja conservador na forma de fazer investimentos, mas está disposto a aprender mais para conquistar sua liberdade financeira.",
  },
];

export const GOAL_CATEGORIES = DIMENSIONS.map(d => ({ key: d.key, label: d.label }));

export const DIMENSION_LABELS: Record<DimensionKey, string> = DIMENSIONS.reduce(
  (acc, d) => {
    acc[d.key] = d.label;
    return acc;
  },
  {} as Record<DimensionKey, string>
);

