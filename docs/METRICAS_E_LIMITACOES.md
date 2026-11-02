# Métricas e Limitações — Olhar em Leitura

Este documento define as **fórmulas** das métricas geradas pelo protótipo e dá
**exemplos numéricos simples**. Todas as métricas são **geométricas e
descritivas**: descrevem onde a estimativa do olhar caiu em relação à área de
leitura. Elas **não** medem atenção, foco, distração, fadiga nem qualquer
condição clínica.

Convenções usadas nos exemplos:

- Intervalo de amostragem: `intervalMs = 100` (≈ 10 Hz, uma amostra a cada ~100
  ms).
- Classificações possíveis de cada amostra: `inside`, `outside`, `missing`,
  `outlier`.
- Amostras **válidas** = `inside` + `outside`. Amostras `missing` e `outlier`
  são **excluídas** dos tempos e percentuais dentro/fora.

A implementação de referência está em `src/core/metrics.js` e
`src/core/episodeDetector.js`.

---

## 1. Cobertura de rastreamento (`trackingCoverage`)

**Fórmula:**

```
cobertura = (nº de amostras válidas) / (nº total de amostras)
          = (inside + outside) / total
```

**Exemplo:** em 100 amostras no total, 70 `inside`, 10 `outside`, 15 `missing` e
5 `outlier`:

```
válidas  = 70 + 10 = 80
cobertura = 80 / 100 = 0,80 = 80%
```

Se a cobertura ficar **abaixo de 70%** (`0,70`), o sistema emite um **aviso
operacional** (`coverageWarning = true`). Isso **não** é um corte clínico: apenas
indica que muitas amostras foram perdidas e que as estimativas são menos
confiáveis.

---

## 2. Tempo dentro / fora (`timeInsideMs`, `timeOutsideMs`)

Cada amostra válida representa aproximadamente `intervalMs` de tempo.

**Fórmulas:**

```
timeInsideMs  = (nº de amostras inside)  × intervalMs
timeOutsideMs = (nº de amostras outside) × intervalMs
```

**Exemplo:** com 70 `inside`, 10 `outside` e `intervalMs = 100`:

```
timeInsideMs  = 70 × 100 = 7000 ms  (7,0 s)
timeOutsideMs = 10 × 100 = 1000 ms  (1,0 s)
```

As amostras `missing`/`outlier` **não** somam tempo dentro nem fora.

---

## 3. Percentuais dentro / fora (`percentInside`, `percentOutside`)

Os percentuais são calculados **apenas** sobre as amostras **válidas**
(excluindo `missing` e `outlier`).

**Fórmulas:**

```
percentInside  = (inside  / válidas) × 100
percentOutside = (outside / válidas) × 100
```

**Exemplo:** com 70 `inside`, 10 `outside` (válidas = 80):

```
percentInside  = (70 / 80) × 100 = 87,5%
percentOutside = (10 / 80) × 100 = 12,5%
```

Observe que o denominador é **80** (válidas), e não 100 (total). Isso evita que
perdas de rastreamento distorçam a proporção dentro/fora.

---

## 4. Duração de episódio (`durationMs`)

Um **episódio de afastamento visual** só é confirmado após o olhar permanecer
continuamente **fora** por **≥ 1000 ms**. A duração vai do **início** do episódio
(primeira amostra do trecho confirmado de "fora") até o **fim** (primeira amostra
do trecho de retorno confirmado) ou até a terminação do episódio.

**Fórmula:**

```
durationMs = endElapsedMs - startElapsedMs
```

**Exemplo:** início em `startElapsedMs = 5000` ms e retorno confirmado começando
em `endElapsedMs = 7000` ms:

```
durationMs = 7000 - 5000 = 2000 ms  (2,0 s)
```

Episódios são **interrompidos** (nunca mesclados) por perda de rastreamento,
pausa manual ou aba oculta.

Agregados por episódio (sobre os episódios confirmados com retorno):

- `meanEpisodeMs` — duração **média**.
- `medianEpisodeMs` — duração **mediana**.
- `longestEpisodeMs` — **maior** duração.

---

## 5. Latência de retorno (`returnLatencyMs`)

A **latência de retorno** é o tempo entre o início do episódio e o **retorno
confirmado** (quando o olhar permanece continuamente **dentro** por **≥ 300 ms**;
o fim é a primeira amostra desse trecho de "dentro").

**Fórmula (para um episódio com retorno confirmado):**

```
returnLatencyMs = endElapsedMs - startElapsedMs
```

**Exemplo:** início em 5000 ms, trecho de retorno confirmado começando em 7000
ms:

```
returnLatencyMs = 7000 - 5000 = 2000 ms
```

A latência média de retorno (`meanReturnLatencyMs`) é a média das latências dos
episódios que confirmaram retorno. Episódios que **não** confirmaram retorno
(terminados por perda de rastreamento, pausa, aba oculta ou fim dos dados) têm
`returnLatencyMs = null` e **não** entram nessa média.

---

## 6. Dados insuficientes

Se houver menos de 2 amostras válidas, as métricas de tempo/percentual/episódio
não são confiáveis e o resultado sinaliza:

```
insufficientData = true
reason = "dados insuficientes"
```

Ainda assim, a cobertura e as contagens por tipo de amostra são informadas.

---

## 7. Limitações importantes

- **O sistema não lê palavra por palavra.** Ele apenas classifica a estimativa do
  olhar como **dentro** ou **fora** da área de leitura e identifica **episódios
  sustentados**. Não há rastreamento de fixações/sacadas em nível de palavra.
- **Não é equivalente a um *eye tracker* infravermelho de laboratório.** A
  estimativa por webcam é consideravelmente mais ruidosa e menos precisa; o erro
  pode chegar a dezenas ou centenas de pixels.
- **Os limiares são parâmetros operacionais iniciais, não cortes clínicos.** Os
  valores de 1000 ms (afastamento), 300 ms (retorno), 70% (aviso de cobertura) e
  150 px (aviso de erro de verificação) foram escolhidos para reduzir falsos
  positivos e tornar os eventos interpretáveis; eles podem ser ajustados e **não**
  têm significado clínico.
- **Comportamento visual ≠ atenção cognitiva.** Olhar para fora não significa
  desatenção, e olhar para dentro não significa compreensão. Qualquer
  interpretação cognitiva vai além do que o sistema mede.
