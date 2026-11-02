// Textos de leitura originais (pt-BR) e questionários de compreensão.
//
// Os textos abaixo foram escritos originalmente para este protótipo acadêmico,
// sobre temas neutros e não sensíveis, sem material protegido por direitos
// autorais de terceiros. Cada texto tem de 3 a 5 perguntas de múltipla escolha
// com gabarito e uma explicação curta. As perguntas avaliam compreensão
// literal e inferencial do próprio texto, não conhecimento prévio.
//
// O questionário é usado apenas no Modo A e SOMENTE após o fim da leitura. O
// resultado de compreensão é mantido separado dos indicadores oculares.

/**
 * @typedef {Object} QuizOption
 * @property {string} id
 * @property {string} text
 *
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} prompt
 * @property {QuizOption[]} options
 * @property {string} correctId
 * @property {string} explanation
 * @property {'literal'|'inferencial'} type
 *
 * @typedef {Object} ReadingText
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {number} wordCount
 * @property {string[]} paragraphs
 * @property {QuizQuestion[]} questions
 */

/** Limite razoável para texto colado pelo usuário (Modo B), em caracteres. */
export const MAX_CUSTOM_TEXT_CHARS = 20000;

/** @type {ReadingText[]} */
export const READING_TEXTS = [
  {
    id: 'texto-pontes',
    title: 'As pontes e a travessia dos rios',
    summary:
      'Texto informativo sobre como as pontes resolveram o problema de atravessar rios e vales ao longo do tempo.',
    paragraphs: [
      'Desde que as primeiras comunidades se fixaram perto de rios, atravessar a água foi um desafio constante. Os rios ofereciam peixe, terra fértil e um caminho natural para transportar mercadorias, mas também separavam margens que precisavam se comunicar. Durante muito tempo, a travessia dependia de barcas, de trechos rasos onde era possível caminhar ou de troncos caídos que serviam de passagem improvisada. Nenhuma dessas soluções era confiável o ano inteiro, pois o nível da água mudava com as chuvas e com as estações.',
      'A ponte surgiu como uma resposta durável a esse problema. Em vez de depender do humor do rio, as pessoas passaram a construir uma estrutura fixa que vencia o vão entre as duas margens. As primeiras pontes eram simples: uma pedra grande apoiada sobre outras, ou uma sequência de troncos amarrados. Com o tempo, percebeu-se que a forma da estrutura importava tanto quanto o material. Uma peça reta apoiada nas pontas tende a ceder no meio quando recebe peso, e foi observando esse comportamento que os construtores começaram a procurar formas mais resistentes.',
      'O arco foi uma das descobertas mais importantes. Quando as pedras são dispostas em curva e encaixadas com cuidado, o peso que vem de cima é transformado em forças que empurram as pedras umas contra as outras, e essas forças descem pelas laterais até o chão. Em vez de quebrar no centro, o arco se mantém justamente porque está sendo comprimido. Essa ideia permitiu construir pontes muito mais longas e capazes de sustentar carroças pesadas, e muitas delas resistiram por séculos, atravessando guerras e enchentes sem desabar.',
      'Com a chegada de novos materiais, as pontes mudaram de escala. O ferro e, depois, o aço eram resistentes o bastante para formar vãos enormes sem precisar de muitos apoios no meio do rio. Isso foi especialmente útil onde a água era profunda ou onde a navegação não podia ser interrompida por pilares. Engenheiros passaram a pendurar a pista em grandes cabos sustentados por torres altas, criando as pontes suspensas que hoje cruzam baías e canais largos. A mesma lógica antiga continuava presente: distribuir o peso de maneira que nenhum ponto isolado tivesse de suportar tudo sozinho.',
      'Construir uma ponte, porém, nunca foi só uma questão de engenharia. Escolher onde ela ficaria mudava o destino de cidades inteiras. Um povoado que antes era ponto final de uma estrada podia se transformar em passagem obrigatória, atraindo comércio e gente nova. Por isso, a decisão de erguer uma ponte costumava envolver autoridades, comerciantes e moradores, cada um com seus próprios interesses. A estrutura de pedra ou de aço era apenas a parte visível de um acordo social sobre para onde a vida da região deveria caminhar.',
      'Hoje atravessamos pontes quase sem pensar nelas, como se fossem apenas uma continuação da rua. Essa naturalidade é, de certo modo, a prova do seu sucesso. Uma boa ponte não chama atenção para o esforço que a mantém de pé; ela apenas permite que a travessia aconteça. Ainda assim, por trás de cada passagem tranquila existe uma longa história de observação, tentativa e correção, em que cada geração aproveitou o que a anterior aprendeu sobre a difícil arte de vencer um rio.',
    ],
    questions: [
      {
        id: 'q1',
        type: 'literal',
        prompt:
          'Segundo o texto, antes das pontes, de que dependia a travessia dos rios?',
        options: [
          { id: 'a', text: 'De barcas, trechos rasos e troncos caídos.' },
          { id: 'b', text: 'De grandes arcos de pedra já existentes.' },
          { id: 'c', text: 'De cabos de aço sustentados por torres.' },
          { id: 'd', text: 'De túneis cavados sob o leito do rio.' },
        ],
        correctId: 'a',
        explanation:
          'O segundo parágrafo cita barcas, trechos rasos para caminhar e troncos caídos como as soluções usadas antes das pontes.',
      },
      {
        id: 'q2',
        type: 'literal',
        prompt: 'De acordo com o texto, por que o arco se mantém de pé?',
        options: [
          { id: 'a', text: 'Porque é feito de um material mais leve.' },
          {
            id: 'b',
            text: 'Porque o peso o comprime e as forças descem pelas laterais.',
          },
          { id: 'c', text: 'Porque fica pendurado em grandes cabos.' },
          { id: 'd', text: 'Porque é apoiado por muitos pilares no meio do rio.' },
        ],
        correctId: 'b',
        explanation:
          'O terceiro parágrafo explica que o peso de cima é transformado em forças de compressão que descem pelas laterais até o chão.',
      },
      {
        id: 'q3',
        type: 'inferencial',
        prompt:
          'Quando o texto diz que uma boa ponte "não chama atenção para o esforço que a mantém de pé", ele sugere que:',
        options: [
          { id: 'a', text: 'As pontes modernas são frágeis e pouco confiáveis.' },
          {
            id: 'b',
            text: 'O bom funcionamento da ponte faz com que a travessia pareça simples.',
          },
          { id: 'c', text: 'As pontes deveriam ser mais decoradas.' },
          { id: 'd', text: 'O esforço de engenharia foi pequeno.' },
        ],
        correctId: 'b',
        explanation:
          'É uma inferência: o texto associa a naturalidade da travessia ao sucesso da estrutura, não à ausência de esforço.',
      },
      {
        id: 'q4',
        type: 'inferencial',
        prompt:
          'A menção de que a ponte era "a parte visível de um acordo social" indica que:',
        options: [
          {
            id: 'a',
            text: 'A construção envolvia interesses de diferentes grupos da região.',
          },
          { id: 'b', text: 'As pontes eram sempre construídas em segredo.' },
          { id: 'c', text: 'Apenas engenheiros decidiam onde construir.' },
          { id: 'd', text: 'As pontes não tinham importância econômica.' },
        ],
        correctId: 'a',
        explanation:
          'O quinto parágrafo mostra autoridades, comerciantes e moradores com interesses próprios, indicando uma decisão social.',
      },
    ],
  },
  {
    id: 'texto-sementes',
    title: 'As sementes e suas viagens',
    summary:
      'Texto informativo sobre as diferentes estratégias que as plantas usam para espalhar suas sementes.',
    paragraphs: [
      'Uma planta enraizada no solo não pode se mover para procurar um lugar melhor, mas isso não significa que ela esteja presa a um único ponto para sempre. A cada geração, as plantas têm uma chance de ocupar novos espaços por meio das sementes. Espalhar as sementes para longe da planta-mãe é importante por uma razão prática: se todas caíssem no mesmo lugar, as novas plantas competiriam entre si e com a planta original por luz, água e nutrientes. A distância, portanto, aumenta as chances de que pelo menos algumas sementes encontrem condições favoráveis.',
      'Uma das estratégias mais conhecidas é o uso do vento. Muitas sementes desenvolveram estruturas leves, parecidas com asas ou paraquedas, que prolongam o tempo em que ficam no ar. Enquanto flutuam, podem ser levadas para bem longe, especialmente em terrenos abertos. Essa solução é barata para a planta, pois não exige recompensa para ninguém, mas também é imprevisível: o vento não escolhe um bom destino e muitas sementes acabam em lugares onde não conseguem germinar.',
      'A água oferece outro caminho. Plantas que vivem perto de rios, lagos e do mar costumam ter sementes capazes de flutuar e de resistir à umidade por longos períodos. Levadas pela correnteza ou pelas marés, essas sementes podem percorrer grandes distâncias antes de alcançar uma margem onde se fixar. Algumas chegam até a colonizar ilhas distantes, carregadas pela água por semanas. Nesse caso, a casca resistente funciona como uma pequena embarcação que protege o conteúdo durante a viagem.',
      'Talvez a estratégia mais curiosa envolva os animais. Muitas plantas produzem frutos saborosos justamente para serem comidos. O animal se alimenta da polpa, mas as sementes, protegidas por uma casca dura, passam pelo seu corpo sem serem digeridas e são depositadas longe dali, muitas vezes junto com um pouco de adubo natural. Outras sementes preferem pegar carona por fora: têm ganchos ou pelos que se prendem à pelagem dos animais e são carregadas sem que o animal perceba, até que caiam em algum ponto do caminho.',
      'Há ainda plantas que preferem contar com as próprias forças. Algumas vagens secam ao sol e se abrem de repente, lançando as sementes a vários metros de distância com um pequeno estalo. É um impulso curto, mas suficiente para afastar a nova geração da sombra da planta-mãe. Essa independência tem um limite claro: sem a ajuda do vento, da água ou dos animais, o alcance dessas sementes é bem menor, e elas tendem a formar grupos próximos de onde nasceram.',
      'Observando essas soluções, percebe-se que não existe um único jeito certo de viajar. Cada estratégia tem vantagens e custos, e muitas plantas combinam mais de uma delas ao longo de sua história. Uma mesma espécie pode, por exemplo, deixar algumas sementes caírem perto e confiar o restante ao vento, aumentando as chances de que pelo menos parte encontre um bom lugar. Essa variedade de apostas é, em si, uma forma de proteção contra anos ruins, em que uma rota pode falhar enquanto outra dá certo. O resultado é uma espécie de movimento silencioso que acontece o tempo todo ao nosso redor: enquanto caminhamos distraídos, sementes seguem viagem no ar, na água e grudadas em quem passa, tentando, cada uma à sua maneira, encontrar o próximo lugar onde valerá a pena nascer.',
    ],
    questions: [
      {
        id: 'q1',
        type: 'literal',
        prompt:
          'Segundo o texto, por que é importante que as sementes se espalhem para longe da planta-mãe?',
        options: [
          {
            id: 'a',
            text: 'Para evitar que as novas plantas disputem recursos com a planta original.',
          },
          { id: 'b', text: 'Para que todas germinem ao mesmo tempo.' },
          { id: 'c', text: 'Para que fiquem protegidas do vento.' },
          { id: 'd', text: 'Para que os animais não as comam.' },
        ],
        correctId: 'a',
        explanation:
          'O primeiro parágrafo diz que, se todas caíssem no mesmo lugar, competiriam por luz, água e nutrientes.',
      },
      {
        id: 'q2',
        type: 'literal',
        prompt: 'De acordo com o texto, como a água ajuda a espalhar sementes?',
        options: [
          { id: 'a', text: 'Dissolvendo a casca para liberar o conteúdo.' },
          {
            id: 'b',
            text: 'Carregando sementes que flutuam e resistem à umidade por longos períodos.',
          },
          { id: 'c', text: 'Lançando as sementes a vários metros de distância.' },
          { id: 'd', text: 'Prendendo as sementes à pelagem dos animais.' },
        ],
        correctId: 'b',
        explanation:
          'O terceiro parágrafo descreve sementes que flutuam e resistem à umidade, levadas pela correnteza ou pelas marés.',
      },
      {
        id: 'q3',
        type: 'inferencial',
        prompt:
          'A comparação da casca resistente com "uma pequena embarcação" sugere que a casca:',
        options: [
          { id: 'a', text: 'Serve para atrair animais famintos.' },
          { id: 'b', text: 'Protege o conteúdo da semente durante a viagem pela água.' },
          { id: 'c', text: 'Torna a semente mais pesada para afundar.' },
          { id: 'd', text: 'Impede que a semente germine.' },
        ],
        correctId: 'b',
        explanation:
          'A metáfora da embarcação indica proteção do conteúdo durante o deslocamento pela água.',
      },
      {
        id: 'q4',
        type: 'inferencial',
        prompt:
          'Com base no texto, por que as sementes lançadas pelas próprias vagens tendem a formar grupos próximos da planta-mãe?',
        options: [
          {
            id: 'a',
            text: 'Porque seu alcance é limitado sem a ajuda do vento, da água ou de animais.',
          },
          { id: 'b', text: 'Porque são pesadas demais para germinar.' },
          { id: 'c', text: 'Porque preferem a sombra da planta-mãe.' },
          { id: 'd', text: 'Porque dependem das marés para se mover.' },
        ],
        correctId: 'a',
        explanation:
          'O quinto parágrafo afirma que, sem outros agentes, o alcance é menor, de modo que elas ficam próximas de onde nasceram.',
      },
      {
        id: 'q5',
        type: 'inferencial',
        prompt: 'A ideia central do último parágrafo é que:',
        options: [
          { id: 'a', text: 'Existe uma única estratégia realmente eficiente.' },
          {
            id: 'b',
            text: 'Diferentes estratégias coexistem, cada uma com vantagens e custos.',
          },
          { id: 'c', text: 'As plantas evitam se espalhar sempre que possível.' },
          { id: 'd', text: 'Apenas o vento é capaz de levar sementes longe.' },
        ],
        correctId: 'b',
        explanation:
          'O fechamento destaca que não há um único jeito certo e que muitas plantas combinam estratégias.',
      },
    ],
  },
];

/** Contagem de palavras aproximada de cada texto, calculada sob demanda. */
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Preenche wordCount de cada texto a partir dos parágrafos.
for (const t of READING_TEXTS) {
  t.wordCount = t.paragraphs.reduce((acc, p) => acc + countWords(p), 0);
}

/**
 * Busca um texto de leitura por id.
 * @param {string} id
 * @returns {ReadingText|null}
 */
export function getTextById(id) {
  return READING_TEXTS.find((t) => t.id === id) ?? null;
}
