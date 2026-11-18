# Olhar em Leitura

Protótipo acadêmico de rastreamento ocular por **webcam** para caracterizar
padrões de **comportamento visual** durante a leitura de um texto na tela. O
projeto foi desenvolvido como apoio a um Trabalho de Conclusão de Curso (TCC) e
roda inteiramente no navegador, sem servidor, sem banco de dados e sem nuvem.

> **Importante:** este NÃO é um instrumento clínico nem de diagnóstico. Ele
> estima a posição do olhar e registra eventos **geométricos** em relação a uma
> área de leitura definida na tela. Ele **não** mede atenção, foco, distração,
> fadiga, nem qualquer condição de saúde.

---

## 1. O que o sistema mede (e o que NÃO mede)

### O que ele mede

- Uma **estimativa da posição do olhar** (coordenadas x, y em pixels da janela
  do navegador), produzida pela biblioteca WebGazer.js a partir das imagens da
  webcam.
- **Eventos geométricos** relativos à *área de leitura* (a região retangular
  onde o texto é exibido):
  - se a estimativa do olhar está **dentro** ou **fora** dessa área;
  - **episódios de afastamento visual**: períodos em que o olhar fica
    continuamente **fora** da área de leitura por tempo suficiente para serem
    confirmados;
  - **retorno à área de leitura**: quando o olhar volta e permanece **dentro**
    por tempo suficiente para ser confirmado.
- Métricas descritivas agregadas (cobertura de rastreamento, tempo dentro/fora,
  número e duração de episódios, latência de retorno). Veja
  [docs/METRICAS_E_LIMITACOES.md](docs/METRICAS_E_LIMITACOES.md).

### O que ele NÃO mede

- **Não** mede atenção, foco, concentração, distração, cansaço ou fadiga.
- **Não** emite escore de atenção ou de distração.
- **Não** faz diagnóstico de nenhuma condição clínica, neurológica ou de
  aprendizagem.
- **Não** lê o texto palavra por palavra e **não** equivale a um *eye tracker*
  infravermelho de laboratório.

"Olhar fora da área de leitura" é um **evento geométrico** (a estimativa de
posição caiu fora de um retângulo), e não uma inferência sobre o estado mental
da pessoa. A distinção entre comportamento visual e atenção cognitiva está
detalhada em [docs/PROTOCOLO_TCC.md](docs/PROTOCOLO_TCC.md).

---

## 2. Aviso científico e ético

- O protótipo produz **estimativas** sujeitas a ruído e a erro de calibração. Os
  limiares usados (por exemplo, 1000 ms para confirmar um afastamento e 300 ms
  para confirmar um retorno) são **parâmetros operacionais iniciais**, escolhidos
  para reduzir falsos positivos, e **não** são cortes clínicos.
- Qualquer pesquisa envolvendo participantes humanos deve ser **discutida com o
  orientador** e seguir as **exigências institucionais e éticas** aplicáveis
  (por exemplo, aprovação em Comitê de Ética e Termo de Consentimento Livre e
  Esclarecido), antes de qualquer coleta de dados com pessoas.

---

## 3. Privacidade

- A webcam é usada **somente dentro do navegador**. Todo o processamento de
  imagem acontece localmente, na própria máquina.
- O sistema **não grava, não salva e não envia vídeo** para lugar nenhum. Não há
  servidor de backend.
- **Não há telemetria nem analytics.** Nada é transmitido para a internet.
- A permissão de câmera só é solicitada **após uma ação explícita do usuário** e
  o aceite de um consentimento. O microfone **nunca** é solicitado.
- Ao encerrar a sessão, as faixas de mídia (os "tracks" da câmera) são
  liberadas, de modo que a luz/indicador da câmera se apaga.

---

## 4. Requisitos

- **Node.js** em versão compatível com o Vite instalado neste projeto
  (Vite 5.x). O ambiente de desenvolvimento foi validado com **Node.js v22**,
  que funciona corretamente. Em geral, versões LTS recentes (18, 20 ou 22)
  atendem ao Vite 5.x.
- **Navegador:** recomenda-se o **Google Chrome atualizado no macOS**. Outros
  navegadores podem apresentar comportamento diferente para a webcam e para o
  WebGazer; eles **não** são declarados incompatíveis, mas não foram o alvo
  principal dos testes manuais.
- Uma **webcam** funcional (interna do notebook ou externa).
- Boa iluminação frontal e rosto bem enquadrado melhoram muito a qualidade da
  estimativa.

Como instalar o Node.js: baixe o instalador LTS em
[nodejs.org](https://nodejs.org/) e siga o assistente. Ao final, confirme a
instalação abrindo o Terminal e executando `node --version` (deve mostrar algo
como `v22.x.x`).

---

## 5. Como iniciar o sistema (passo a passo para quem não programa)

Abra o **Terminal** (no macOS: Aplicativos → Utilitários → Terminal), vá até a
pasta do projeto e rode os comandos abaixo, **um de cada vez**, pressionando
Enter depois de cada um:

1. Entre na pasta do projeto (ajuste o caminho para onde você descompactou os
   arquivos):

   ```bash
   cd caminho/para/eye-reading-tracker
   ```

2. Instale as dependências (só precisa na primeira vez, ou quando elas mudarem):

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. O Vite vai imprimir um endereço local no Terminal. Normalmente é:

   ```
   http://localhost:5173
   ```

   Copie esse endereço e cole na barra do **Google Chrome**. Se a porta 5173
   estiver ocupada, o Vite escolhe outra (por exemplo, 5174) e mostra o endereço
   exato no Terminal; use sempre o que aparecer na tela.

5. Para encerrar o servidor quando terminar, volte ao Terminal e pressione
   `Ctrl + C`.

---

## 6. Lista MANUAL de testes de fumaça (*smoke tests*)

Estes passos precisam de uma pessoa, um navegador e uma **webcam real**. Eles
**não** foram executados no ambiente de build (veja a Seção 7). Faça-os no seu
MacBook, com o Chrome atualizado:

1. Abra o sistema no Chrome, no endereço `http://localhost:...` que o Vite
   imprimiu (normalmente `http://localhost:5173`).
2. Aceite o **consentimento** apresentado na tela inicial.
3. Conceda a **permissão de uso da webcam** quando o navegador perguntar.
4. Confira a **prévia** (preview) da câmera e veja se o seu rosto está
   enquadrado.
5. Conclua os **9 pontos de calibração** (clique em cada ponto conforme
   instruído).
6. Complete os **5 pontos de verificação** (olhe para cada alvo, sem clicar).
7. **Inicie uma leitura** (escolha/visualize o texto na área de leitura).
8. **Olhe para o texto** e depois **olhe para fora** da área de leitura, para
   provocar um episódio de afastamento e o posterior retorno.
9. **Pause** a sessão e depois **retome** (confira que pausar/retomar funciona).
10. **Encerre** a sessão.
11. Verifique o **relatório** final, exporte e confira o **CSV** e o **JSON**
    (veja a Seção 8 para o significado das colunas).
12. Confirme que a **câmera foi desligada** ao final (o indicador/luz da webcam
    deve apagar).

---

## 7. Status de validação: testes de software x validação experimental

É fundamental separar dois tipos de verificação:

- **Testes de software (automatizados): APROVADOS.** Os módulos puros de lógica
  (classificação de área, detecção de episódios, métricas, exportação de dados,
  mapeamento de coordenadas e amostragem) têm testes unitários automatizados
  (Vitest) que **passam**. Rode-os com:

  ```bash
  npm test
  ```

  Esses testes garantem que a *lógica* está correta, mas **não** usam câmera.

- **Validação da câmera e do fluxo ao vivo: NÃO realizada no build.** O ambiente
  onde este projeto foi montado **não possui webcam física**. Portanto, os
  fluxos que dependem da câmera (início do WebGazer, calibração, verificação e
  leitura ao vivo) **não foram validados** aqui. Eles **exigem teste manual no
  seu MacBook, com webcam real**, seguindo a lista da Seção 6.

- **Validação experimental com participantes: NÃO realizada.** Os testes de
  software **não** são equivalentes a um estudo com pessoas. Validação
  experimental (coleta com participantes, análise de resultados) é uma etapa à
  parte, que deve ser planejada com o orientador e aprovada conforme as
  exigências éticas e institucionais.

---

## 8. Significado das colunas exportadas

### CSV (uma linha por amostra)

Os cabeçalhos do CSV são definidos em `src/core/exportData.js` (`CSV_HEADERS`):

| Coluna              | Significado                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `elapsedMs`         | Tempo decorrido, em milissegundos, desde o início ativo da sessão (pausas **não** contam).       |
| `timestampISO`      | Carimbo de tempo de relógio (data/hora) no formato ISO 8601 do instante da amostra.             |
| `rawX`              | Coordenada X **bruta** estimada pelo WebGazer (pixel da janela); vazio quando não há previsão.  |
| `rawY`              | Coordenada Y **bruta** estimada pelo WebGazer (pixel da janela); vazio quando não há previsão.  |
| `filteredX`         | Coordenada X **suavizada** (mediana móvel de 3) usada só para a classificação de área.          |
| `filteredY`         | Coordenada Y **suavizada** (mediana móvel de 3) usada só para a classificação de área.          |
| `trackingStatus`    | Estado do rastreamento: `valid` (válido), `missing` (sem previsão) ou `outlier` (ponto atípico).|
| `aoiClassification` | Classificação da área: `inside`, `outside`, `missing` ou `outlier`.                             |
| `viewportWidth`     | Largura da janela do navegador (px) no momento da amostra.                                       |
| `viewportHeight`    | Altura da janela do navegador (px) no momento da amostra.                                         |

As amostras são coletadas a aproximadamente **10 Hz** (uma a cada ~100 ms).

### JSON (relatório estruturado)

A estrutura do JSON é definida em `toJSON` (`src/core/exportData.js`) e contém:

- `metadata`: `appVersion`, `webgazerVersion` (`"3.5.3"`), `mode`, `sessionCode`,
  `exportedAtISO`.
- `activeDurationMs`: duração ativa total da sessão (excluindo pausas).
- `samplingParams`: parâmetros de amostragem (`intervalMs`, `targetHz`).
- `thresholds`: limiares operacionais (`outsideConfirmMs`, `returnConfirmMs`).
- `summary`: resumo das métricas **geométricas** do olhar.
- `episodes`: lista de episódios de afastamento/retorno confirmados.
- `pauses`: pausas (manuais ou por aba oculta) e seus respectivos retornos.
- `trackingLossPeriods`: períodos de perda de rastreamento.
- `quizResult`: resultado do questionário de compreensão, mantido **separado** do
  resumo do olhar (nunca é misturado às métricas geométricas).
- `samples`: as amostras individuais (mesmos campos do CSV).

---

## 9. Licença de terceiros (WebGazer.js)

Este projeto usa a biblioteca **WebGazer.js**, versão **3.5.3**, distribuída sob
a licença **GPL-3.0-or-later**. Os créditos e o link para o repositório oficial
estão em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

> **Atenção à universidade/instituição:** a licença GPL-3.0-or-later impõe
> obrigações relevantes caso o software seja **distribuído** (por exemplo,
> disponibilizar o código-fonte correspondente sob a mesma licença). Recomenda-se
> avaliar essas obrigações **antes de qualquer distribuição** do protótipo.

### 9.1 Como o WebGazer é carregado (nota técnica)

O WebGazer.js **não** é empacotado nem transformado pelo Vite/esbuild. Em vez
disso, o pacote prébuild oficial do WebGazer (`node_modules/webgazer/dist/webgazer.js`,
a variante com objeto **global**) é servido **sem qualquer modificação** como um
arquivo estático e carregado por uma tag `<script src="/vendor/webgazer.js">`
(script clássico, **não** módulo) no `index.html`, antes do script da aplicação.
Isso define um `window.webgazer` global, que é consumido **somente** por
`src/services/gazeTracker.js`.

Esse é o método de carregamento **oficialmente suportado** pelo WebGazer e evita
que o minificador do bundler altere os componentes internos (TensorFlow.js) da
biblioteca — a causa dos erros de tempo de execução `z2 is not a function` e
`t5 is not a function` observados anteriormente apenas na versão de produção.

Para manter a cópia servida sempre sincronizada com a dependência fixada em
`webgazer@3.5.3`, um pequeno plugin do Vite (`sync-webgazer-vendor`, em
`vite.config.js`) copia `dist/webgazer.js` para `public/vendor/webgazer.js` a
cada `npm run dev` e `npm run build`. Esse arquivo é **gerado** (está no
`.gitignore`) e **não deve ser editado à mão**.

### 9.2 Modelos do MediaPipe FaceMesh (servidos localmente)

O rastreador facial do WebGazer 3.5.3 é o **MediaPipe FaceMesh**. Ao iniciar a
câmera, o WebGazer chama `faceLandmarksDetection.createDetector` com
`runtime: 'mediapipe'` e um `solutionPath` que, por padrão, é o caminho
**relativo** `'./mediapipe/face_mesh'` (ver
`node_modules/webgazer/src/params.mjs`). A partir desse caminho, o runtime do
MediaPipe carrega um `face_mesh.js` e, em seguida, ~16 MB de arquivos de solução
(WASM + dados do modelo). Se esses arquivos **não** forem servidos no caminho
esperado, as requisições retornam **404** e o próprio wrapper minificado do
MediaPipe lança o erro `t is not a function` de dentro de `webgazer.begin()`
(era esta a causa real do erro "Não foi possível iniciar a câmera").

Esses arquivos acompanham o pacote em
`node_modules/webgazer/dist/mediapipe/face_mesh/`. Para que fiquem acessíveis no
caminho que o WebGazer solicita, o mesmo plugin `sync-webgazer-vendor` copia a
pasta `dist/mediapipe/` **verbatim** (byte a byte; os arquivos binários `.wasm`,
`.data` e `.binarypb` **não** são transformados) para
`public/vendor/mediapipe/`, a cada `npm run dev` e `npm run build`. Eles passam a
ser servidos em `/vendor/mediapipe/face_mesh/…` no dev, no preview e na versão de
produção. Assim como a cópia do `webgazer.js`, esses assets são **gerados**
(estão no `.gitignore`, em `public/vendor/`) e **não** são versionados — são
sempre regenerados a partir do `node_modules`.

Em `src/services/gazeTracker.js` (único módulo autorizado a tocar no
`window.webgazer`), definimos
`webgazer.params.faceMeshSolutionPath = '/vendor/mediapipe/face_mesh'`
**antes** de `webgazer.begin()`. O caminho é **absoluto** (com barra inicial)
para resolver corretamente independentemente da rota atual.

> **Carregamento dos modelos é local:** como os arquivos do MediaPipe FaceMesh
> são servidos pela **própria aplicação** (a partir da sua origem, em
> `/vendor/mediapipe/…`), **não** há download de nenhum CDN ou servidor de
> terceiros ao iniciar a câmera. Nenhum dado da sessão ou vídeo é enviado para
> fora do navegador.

---

## 10. Documentação complementar

- [docs/PROTOCOLO_TCC.md](docs/PROTOCOLO_TCC.md): objetivo, arquitetura, fluxo de
  uso, calibração, uso da webcam/WebGazer, definição de AOI, amostragem, filtros,
  definições operacionais, métricas, limitações e trabalhos futuros.
- [docs/METRICAS_E_LIMITACOES.md](docs/METRICAS_E_LIMITACOES.md): fórmulas e
  exemplos numéricos de cada métrica, além das limitações.
- [docs/REFERENCIAS.md](docs/REFERENCIAS.md): referências bibliográficas e
  técnicas.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md): créditos de terceiros.

---

## 11. Comandos úteis (resumo)

```bash
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento (abre em http://localhost:5173)
npm test        # roda os testes de software automatizados (Vitest)
npm run build   # gera a versão de produção na pasta dist/
npm run preview # pré-visualiza a versão de produção gerada
```
