# Referências verificadas

Documento auxiliar do TCC II de Arthur de Carvalho Palmutti. Verificação realizada em 18 de novembro de 2026.

A lista abaixo contém apenas fontes citadas no artigo. Para cada item são registrados o endereço consultado, o identificador persistente quando disponível e a função da fonte no texto. O conteúdo consultado foi parafraseado para atender às restrições de licenciamento; nenhuma passagem extensa foi reproduzida literalmente.

## [1] Movimentos oculares e leitura

**RAYNER, Keith.** Eye movements in reading and information processing: 20 years of research. *Psychological Bulletin*, v. 124, n. 3, p. 372–422, 1998. DOI: [10.1037/0033-2909.124.3.372](https://doi.org/10.1037/0033-2909.124.3.372). PubMed: [PMID 9849112](https://pubmed.ncbi.nlm.nih.gov/9849112/).

- **Verificação:** título, autor, periódico, volume, número, páginas e DOI conferidos em índice PubMed e registros bibliográficos localizáveis pelo DOI.
- **Uso no TCC:** fundamentação de que o registro dos movimentos oculares é útil para estudar o processamento durante a leitura, sem implicar que uma coordenada isolada determine um estado cognitivo.

## [2] Artigo original do WebGazer

**PAPOUTSAKI, Alexandra; SANGKLOY, Patsorn; LASKEY, James; DASKALOVA, Nediyana; HUANG, Jeff; HAYS, James.** WebGazer: Scalable Webcam Eye Tracking Using User Interactions. In: *Proceedings of the Twenty-Fifth International Joint Conference on Artificial Intelligence (IJCAI-16)*, 2016. Registro ACM: [10.5555/3061053.3061156](https://dl.acm.org/doi/10.5555/3061053.3061156). Página oficial: [IJCAI 2016, artigo 540](https://ijcai.org/proceedings/2016/540).

- **Verificação:** título, seis autores, evento e ano conferidos na página oficial da IJCAI e no índice da ACM.
- **Uso no TCC:** funcionamento geral do WebGazer, uso de webcam comum, aprendizagem por interações e estimativa de coordenadas do olhar na página.

## [3] Comparação com rastreador laboratorial

**KADUK, Tobiasz; GOEKE, Caspar; FINGER, Holger; KÖNIG, Peter.** Webcam eye tracking close to laboratory standards: Comparing a new webcam-based system and the EyeLink 1000. *Behavior Research Methods*, v. 56, p. 5002–5022, 2024. DOI: [10.3758/s13428-023-02141-7](https://doi.org/10.3758/s13428-023-02141-7). PubMed: [PMID 37821751](https://pubmed.ncbi.nlm.nih.gov/37821751/). Texto integral: [PubMed Central PMC11289017](https://pmc.ncbi.nlm.nih.gov/articles/PMC11289017/).

- **Verificação:** autores, título, periódico, volume, páginas, publicação on-line em 2023, edição de 2024 e DOI conferidos em PubMed/PubMed Central.
- **Uso no TCC:** demonstração de que sistemas específicos por webcam podem se aproximar de sistemas de referência em algumas tarefas, sem transferir os números desse estudo ao WebGazer ou ao protótipo desenvolvido.

## [4] Rastreamento por webcam durante leitura

**SERRANO-CAROT, Marina; ANGELE, Bernhard; XU, Hemu; VASILEV, Martin R.** Webcams can be used to study eye movements during reading. *Behavior Research Methods*, 2026. DOI: [10.3758/s13428-026-03199-3](https://doi.org/10.3758/s13428-026-03199-3). Registro institucional: [University College London](https://discovery.ucl.ac.uk/id/eprint/10232549/).

- **Verificação:** título, quatro autores, periódico, ano e DOI conferidos na página da editora, no registro institucional da UCL e no manuscrito dos autores.
- **Uso no TCC:** sustentação da viabilidade de estudos de leitura por webcam e das limitações de ruído, variabilidade e necessidade de maior quantidade de observações em comparação com rastreadores de maior precisão.

## [5] WebGazer aplicado à leitura e compreensão

**HUTT, Stephen; WONG, Aaron; PAPOUTSAKI, Alexandra; BAKER, Ryan S.; GOLD, Joshua I.; MILLS, Caitlin.** Webcam-based eye tracking to detect mind wandering and comprehension errors. *Behavior Research Methods*, 2024. DOI: [10.3758/s13428-022-02040-x](https://doi.org/10.3758/s13428-022-02040-x). PubMed: [PMID 36627435](https://pubmed.ncbi.nlm.nih.gov/36627435/).

- **Verificação:** título, autores, periódico, ano de edição e DOI conferidos em PubMed e na página da editora. Foram omitidas páginas porque não foi possível confirmá-las de modo consistente nas fontes acessíveis.
- **Uso no TCC:** exemplo de emprego do WebGazer em tarefa de leitura e justificativa para manter qualquer inferência cognitiva separada das métricas geométricas deste protótipo.

## [6] Vite

**VITE.** Getting Started. Disponível em: [https://vite.dev/guide/](https://vite.dev/guide/). Para a versão 5: [guia de migração](https://v5.vite.dev/guide/migration). Acesso em: 18 nov. 2026.

- **Verificação:** documentação oficial. O projeto usa Vite 5.4.21; a documentação da série 5 informa suporte a Node.js 18/20 ou posterior.
- **Uso no TCC:** ambiente de desenvolvimento, módulos ES e geração do pacote de produção.

## [7] WebGazer 3.5.3 — repositório e versão

**BROWN WEBGAZER TEAM.** WebGazer.js. Repositório oficial e versão 3.5.3. Disponível em: [https://github.com/brownhci/WebGazer](https://github.com/brownhci/WebGazer) e [releases](https://github.com/brownhci/WebGazer/releases). Acesso em: 18 nov. 2026.

- **Verificação:** a página de releases registra a versão 3.5.3 em 24 fev. 2026 e informa que ela é a última versão planejada, sem garantia de manutenção futura.
- **Uso no TCC:** versão adotada, processamento no navegador, dependência técnica e limitação de manutenção. A licença declarada no pacote/repositório é GPL-3.0-or-later.

## [8] API do WebGazer

**BROWN WEBGAZER TEAM.** Top Level API — WebGazer.js. Disponível em: [https://github.com/brownhci/WebGazer/wiki/Top-Level-API](https://github.com/brownhci/WebGazer/wiki/Top-Level-API). Acesso em: 18 nov. 2026.

- **Verificação:** documentação oficial do projeto.
- **Uso no TCC:** métodos `begin`, `setGazeListener`, `pause`, `resume`, `end`, controles de visualização e interpretação de previsões nulas.

## [9] Acesso à câmera no navegador

**MDN WEB DOCS.** MediaDevices: getUserMedia() method. Disponível em: [https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). Acesso em: 18 nov. 2026.

- **Verificação:** documentação técnica mantida pela MDN.
- **Uso no TCC:** solicitação de permissão, retorno de `MediaStream` e requisito de contexto seguro, incluindo `localhost` para desenvolvimento.

## [10] Lei Geral de Proteção de Dados Pessoais

**BRASIL.** Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Texto oficial consolidado: [Senado Federal](https://legis.senado.leg.br/norma/27457334). Acesso em: 18 nov. 2026.

- **Verificação:** texto legal oficial.
- **Uso no TCC:** princípios de finalidade, adequação, necessidade, segurança e prevenção aplicados como referências de projeto, sem declarar conformidade jurídica formal.

## [11] Dados pessoais em estudos acadêmicos

**AUTORIDADE NACIONAL DE PROTEÇÃO DE DADOS (ANPD).** Guia orientativo: Tratamento de dados pessoais para fins acadêmicos e para a realização de estudos e pesquisas. Disponível em: [gov.br/anpd](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-tratamento-de-dados-pessoais-para-fins-academicos-e-para-a-realizacao-de-estudos-e-pesquisas). Acesso em: 18 nov. 2026.

- **Verificação:** publicação oficial da ANPD.
- **Uso no TCC:** cautelas no tratamento, pseudonimização, minimização e governança de dados comportamentais em atividades acadêmicas.

## [12] Ética em pesquisa com seres humanos

**BRASIL. Conselho Nacional de Saúde.** Resolução nº 466, de 12 de dezembro de 2012. Diretrizes e normas regulamentadoras de pesquisas envolvendo seres humanos. Disponível em: [Conselho Nacional de Saúde](https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2012/resolucao-no-466.pdf/view). Acesso em: 18 nov. 2026.

- **Verificação:** ato normativo oficial, marcado como vigente no portal do CNS.
- **Uso no TCC:** distinção entre ensaio funcional exploratório e pesquisa científica com participantes; necessidade de avaliação ética institucional antes de uma coleta experimental formal.

## Observação de rastreabilidade

As referências [1]–[5] sustentam a fundamentação científica; [6]–[9] sustentam a descrição técnica; [10]–[12] sustentam a discussão de privacidade, proteção de dados e ética. Resultados de testes, arquitetura e limitações específicas do protótipo foram obtidos por inspeção do repositório e execução local, não por fontes externas.