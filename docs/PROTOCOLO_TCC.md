# Protocolo do TCC — Olhar em Leitura

Documento de referência sobre o funcionamento do protótipo "Olhar em Leitura".
Todo o conteúdo descreve medições **geométricas e descritivas** do olhar durante
a leitura; nada aqui mede atenção, foco, distração, fadiga ou qualquer condição
clínica.

---

## 1. Objetivo e escopo

**Objetivo:** oferecer um protótipo que caracterize padrões de **comportamento
visual** durante a leitura de um texto na tela, usando apenas a **webcam** e o
navegador, sem servidor nem nuvem.

**Escopo:**

- Estimar a posição do olhar (em pixels da janela) via WebGazer.js.
- Classificar essa estimativa como **dentro** ou **fora** de uma área de leitura
  (AOI) definida na tela.
- Detectar **episódios de afastamento visual** sustentados e seus **retornos**.
- Gerar métricas descritivas e permitir exportação em CSV e JSON.

**Fora do escopo:** inferência de estado cognitivo, leitura palavra por palavra,
diagnóstico clínico e qualquer escore de atenção/distração.

---

## 2. Arquitetura geral

O sistema é uma aplicação **somente de navegador** (Vite + JavaScript vanilla,
ES modules). A organização separa o **acesso à câmera/WebGazer** da **lógica
pura**, de modo que a lógica seja testável sem câmera.

- `src/services/gazeTracker.js`: **único** ponto de acesso ao WebGazer. Encapsula
  `begin/pause/resume/end`, `setGazeListener`, etc.
- `src/core/coordinateMapper.js`: normaliza a estimativa para pixels CSS da
  janela e marca pontos atípicos (*outliers*).
- `src/core/sampler.js`: *downsampler* determinístico para ~10 Hz (100 ms).
- `src/core/aoi.js`: classificação geométrica (dentro/fora) e mediana móvel.
- `src/core/session.js`: *pipeline* que liga as previsões ao vivo aos módulos
  puros (amostragem, normalização, classificação, perda de rastreamento, pausas).
- `src/core/episodeDetector.js`: detecção de episódios de afastamento/retorno.
- `src/core/metrics.js`: agregação de métricas descritivas.
- `src/core/calibration.js`: geometria da calibração (9 pontos) e matemática da
  verificação (5 alvos).
- `src/core/exportData.js`: montagem de CSV e JSON (sem DOM).
- `src/ui/*`, `src/app.js`, `src/main.js`: telas, gráficos e orquestração da UI.

A lógica pura (`core/`) **não** importa o WebGazer, o que permite exercitá-la de
forma determinística nos testes.

---

## 3. Fluxo de uso

1. **Tela inicial e consentimento.** O usuário lê as informações e aceita o
   consentimento. Nada de câmera acontece antes disso.
2. **Permissão de câmera.** Somente após a ação explícita do usuário, o navegador
   solicita acesso à webcam (o microfone nunca é solicitado).
3. **Prévia da câmera.** O usuário confere o enquadramento do rosto.
4. **Calibração (9 pontos).** O usuário clica em cada ponto de uma grade 3x3 para
   que o WebGazer associe características do olho a posições na tela.
5. **Verificação (5 alvos).** O usuário olha para 5 alvos (sem clicar); o sistema
   estima o erro de posição.
6. **Leitura.** O texto é exibido na área de leitura e a sessão de amostragem
   começa.
7. **Pausar/retomar.** O usuário pode pausar e retomar; a aba oculta pausa
   automaticamente, mas o retorno exige ação explícita.
8. **Encerrar.** A sessão termina, as faixas de mídia são liberadas (câmera
   desliga) e o relatório é gerado.
9. **Relatório e exportação.** São exibidas métricas e é possível exportar CSV e
   JSON. Opcionalmente, um questionário de compreensão é registrado **separado**
   das métricas do olhar.

---

## 4. Calibração e verificação

- **Calibração — 9 pontos (clique).** Os pontos formam uma grade 3x3 posicionada
  entre margens fracionárias da janela (margem padrão de 10% de cada borda). O
  clique em cada ponto fornece ao WebGazer amostras rotuladas para o mapeamento
  olho → tela. A geometria está em `getCalibrationPoints` (`calibration.js`).
- **Verificação — 5 alvos (sem clique).** Os alvos são o centro e os quatro
  cantos internos (dentro das margens). Para cada alvo, coletam-se previsões do
  olhar e calcula-se o **erro** como a distância (px) entre o centro do alvo e a
  **mediana** das coordenadas previstas (mediana de x e de y, independentes). O
  **erro geral** é a **mediana** dos erros por alvo (`computeVerificationError`).
- **Aviso não bloqueante.** Se o erro mediano for alto (limite sugerido de
  150 px) ou se houver poucas amostras por alvo (mínimo sugerido de 5), o sistema
  exibe um **aviso informativo**, sem bloquear o usuário
  (`evaluateVerification`). Esses limites são **operacionais**, não clínicos.

---

## 5. Como a webcam e o WebGazer são utilizados

- A webcam é acessada **apenas no navegador**, via WebGazer.js 3.5.3, após
  consentimento explícito. O processamento de imagem é **local**; **nenhum vídeo
  é gravado, salvo ou transmitido**, e não há telemetria.
- O WebGazer fornece previsões por meio de um *listener*: o dado é `{x, y}` em
  **pixels da janela** (viewport/client), ou **`null`** quando não há previsão
  (perda de rastreamento). Um `null` significa **ausência de dado** (`missing`),
  **nunca** "fora da área".
- Todo o acesso ao WebGazer é isolado em `src/services/gazeTracker.js`; a lógica
  de análise não conhece a biblioteca.
- Ao encerrar, as faixas de mídia são liberadas, de modo que o indicador da
  câmera se apaga.

---

## 6. Definição da AOI (área de leitura)

A **AOI** é o retângulo onde o texto é exibido. Em tempo de execução, o retângulo
vem de `getBoundingClientRect()` do elemento de leitura, em pixels CSS da janela.
A classificação (`classifyPoint` em `aoi.js`) é puramente geométrica:

- `inside` — o ponto estimado está com `x` em `[left, right]` **e** `y` em
  `[top, bottom]`.
- `outside` — um ponto **válido** que cai fora do retângulo.
- `missing` — não houve previsão (ponto `null`).
- `outlier` — ponto atípico sinalizado pelo mapeador de coordenadas (ou
  coordenada não finita).

---

## 7. Frequência de amostragem (10 Hz)

Embora o WebGazer emita previsões em ritmo mais rápido, as amostras armazenadas
são reduzidas para aproximadamente **10 Hz**, ou seja, **uma a cada ~100 ms**
(`createSampler` em `sampler.js`). A decisão usa tempos monótonos fornecidos pelo
chamador (baseados em `performance.now()`), mantendo o amostrador determinístico.
O tempo de pausa **não** infla o tempo decorrido: `elapsedMs` conta apenas o
tempo **ativo**.

---

## 8. Filtros utilizados

Aplica-se uma **mediana móvel de 3 amostras** (`createMovingMedian` em `aoi.js`)
**apenas** para estabilizar a **classificação de AOI**. Ou seja:

- As coordenadas **brutas** (`rawX`, `rawY`) são sempre preservadas e exportadas.
- As coordenadas **suavizadas** (`filteredX`, `filteredY`) servem **somente** para
  decidir dentro/fora, reduzindo oscilações de curto prazo.
- Pontos inválidos (nulos/atípicos) **não** atualizam a janela do filtro, e a
  suavização é **reiniciada** em perdas de rastreamento e pausas, para não unir
  trechos através de uma interrupção.

---

## 9. Definições operacionais de afastamento e retorno

As definições são **geométricas e temporais**, nunca clínicas
(`episodeDetector.js`):

- **Afastamento visual (confirmado):** o olhar permanece continuamente **fora**
  da área de leitura por **≥ 1000 ms** (`outsideConfirmMs`). O **início** do
  episódio é a primeira amostra desse trecho confirmado de "fora".
- **Retorno à área de leitura (confirmado):** o olhar permanece continuamente
  **dentro** por **≥ 300 ms** (`returnConfirmMs`). O **fim** do episódio é a
  primeira amostra do trecho confirmado de "dentro".
- **Quebra de episódios:** episódios são **interrompidos** (nunca mesclados) por
  **perda de rastreamento** (sequência de `missing`/`outlier`), por **pausa
  manual** ou por **aba oculta** (`visibilitychange`).
- Amostras `missing`/`outlier` **nunca** contam como "fora" e **não** iniciam,
  estendem ou "emendam" um trecho de afastamento.

Esses limiares são **parâmetros operacionais iniciais**, calibrados para reduzir
falsos positivos, e podem ser ajustados; não são cortes de significado clínico.

---

## 10. Métricas geradas

Resumo (detalhes e exemplos em
[METRICAS_E_LIMITACOES.md](METRICAS_E_LIMITACOES.md)):

- **Cobertura de rastreamento** (`trackingCoverage`): proporção de amostras
  válidas (dentro + fora) sobre o total; cobertura < 70% gera um **aviso
  operacional** (não clínico).
- **Tempo dentro/fora** (`timeInsideMs`, `timeOutsideMs`): estimados como
  `contagem × intervalo` (~100 ms por amostra).
- **Percentuais dentro/fora** (`percentInside`, `percentOutside`): calculados
  **somente** sobre amostras válidas (excluindo `missing` e `outlier`).
- **Episódios confirmados** (`confirmedEpisodeCount`) e suas durações (média,
  mediana, maior).
- **Latência de retorno** (`meanReturnLatencyMs`): tempo do início do episódio
  até o retorno confirmado.
- **Períodos de perda de rastreamento** (`trackingLossPeriods`).

Se não houver dados válidos suficientes, o resultado sinaliza
`insufficientData: 'dados insuficientes'`.

O resultado do **questionário de compreensão** é mantido **separado** das
métricas do olhar (`quizResult`), para nunca ser confundido com as medições
geométricas.

---

## 11. Limitações do rastreamento ocular por webcam

- A estimativa por webcam é **ruidosa** e sensível a iluminação, distância,
  movimento da cabeça e qualidade da câmera. O erro pode ser de dezenas a
  centenas de pixels.
- **Não** há precisão para leitura palavra por palavra; por isso o protótipo se
  restringe à **classificação ampla** (dentro/fora da área) e a **episódios
  sustentados**.
- **Não** equivale a um *eye tracker* infravermelho de laboratório.
- Perdas de rastreamento (rosto fora de quadro, baixa luz) geram amostras
  `missing` e interrompem episódios.

---

## 12. Comportamento visual x atenção cognitiva

O sistema mede **comportamento visual observável** (onde a estimativa do olhar
cai em relação a um retângulo), e **não** o estado **cognitivo** da pessoa.
Olhar para fora da área **não** implica desatenção, assim como olhar para dentro
**não** implica compreensão ou foco. Inferir atenção, foco, distração ou fadiga a
partir destes dados seria uma extrapolação não suportada pelo que o sistema
efetivamente mede.

---

## 13. Possibilidades de avaliação futura

- Estudo de **validação experimental com participantes** (planejado com o
  orientador e aprovado eticamente) para caracterizar precisão e utilidade.
- Comparação com um *eye tracker* de referência, para quantificar o erro.
- Ajuste empírico dos limiares operacionais (afastamento/retorno) a partir de
  dados coletados.
- Investigação de estratégias de calibração/verificação que reduzam o erro
  mediano.
- Estudos de robustez sob diferentes condições de iluminação e hardware.
