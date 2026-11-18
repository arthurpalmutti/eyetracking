# Relatório de verificação do TCC II

**Autor:** Arthur de Carvalho Palmutti  
**Curso:** Engenharia Biomédica — Instituto de Ciência e Tecnologia, Universidade Federal de São Paulo  
**Orientador:** Prof. Dr. Mateus Fernandes Réu Urban  
**Data da verificação:** 18 de novembro de 2026

## 1. Documentos institucionais considerados

Foram considerados os dois textos fornecidos pelo autor:

1. modelo de artigo final da disciplina TCC II, adaptado do Congresso Brasileiro de Engenharia Biomédica 2022;
2. modelo de capa, folha de rosto, folha de aprovação e marcador para ficha catalográfica do ICT/Unifesp.

### Exigências aplicadas

- artigo entre 4 e 8 páginas, incluindo referências e excluindo capa/folha de rosto;
- página A4, margens espelhadas: superior 2,5 cm, inferior 4 cm, interna 1,9 cm e externa 1,4 cm;
- duas colunas de 85,5 mm, separadas por 6 mm;
- Times New Roman e espaçamento simples;
- título centralizado, 14 pontos e negrito, em até duas linhas;
- autores em 12 pontos e afiliações em 9 pontos;
- resumo e abstract com até 300 palavras;
- até cinco palavras-chave;
- títulos principais numerados com algarismos romanos e subtítulos com letras;
- corpo em 10 pontos e recuo de primeira linha de 4 mm;
- legendas de tabelas acima e de figuras abaixo, em 8 pontos;
- referências numeradas por ordem de primeira citação no texto;
- capa, folha de rosto, folha de aprovação e página reservada à ficha catalográfica.

O modelo institucional determina submissão final em PDF. O pedido do autor exige também um Word editável. O Word é o arquivo-fonte e usa Times New Roman conforme a norma. O PDF gerado neste ambiente é apenas uma prévia de paginação: como a fonte proprietária Times New Roman não está instalada no sandbox, a prévia usa a família serifada Times-Roman. O PDF definitivo deve ser exportado pelo Microsoft Word no computador do autor.

## 2. Informações confirmadas pelo autor

- nome: Arthur de Carvalho Palmutti;
- título adotado: “Desenvolvimento de uma aplicação web para rastreamento ocular durante atividades de leitura”;
- orientador: Professor Doutor Mateus Fernandes Réu Urban;
- sem coorientador;
- ano: 2026;
- a calibração funcionou e o fluxo foi executado nos navegadores Google Chrome e Opera.

A data de aprovação, os membros da banca e a ficha catalográfica não foram informados. Permanecem como campos de substituição no documento.

## 3. Auditoria técnica do software

A inspeção abrangeu `package.json`, `package-lock.json`, `README.md`, documentação, código em `src/`, testes em `tests/`, histórico Git e relatórios internos de implementação.

### Funcionalidades identificadas no código inspecionado

- aplicação web Vite + JavaScript vanilla;
- WebGazer 3.5.3 fixado;
- consentimento antes da solicitação de câmera;
- solicitação apenas de vídeo, sem microfone;
- modos de teste de leitura e sessão prolongada dentro da página;
- calibração com nove pontos e verificação com cinco alvos;
- amostragem nominal de 10 Hz;
- classificação geométrica da área de leitura;
- distinção entre `inside`, `outside`, `missing` e `outlier`;
- mediana móvel de três amostras para classificação;
- confirmação de afastamento após 1000 ms e retorno após 300 ms;
- pausa manual e por aba oculta;
- métricas, linha do tempo, mapa de ocupação, trajetória e exportações CSV/JSON;
- armazenamento local somente de preferências e resumos sanitizados.

### Divergência de escopo corrigida no texto

A concepção fornecida descrevia um modo contínuo capaz de acompanhar outras atividades. O código não faz isso. O sistema só acompanha conteúdo exibido dentro da própria página e pausa quando a aba fica oculta. O TCC descreve o escopo real e apresenta acompanhamento entre aplicativos apenas como possibilidade futura, não como funcionalidade concluída.

## 4. Testes executados nesta entrega

### Testes unitários

Comando: `npm test`  
Resultado: **5 arquivos aprovados; 49 testes aprovados; nenhuma falha**.

Cobertura funcional direta da suíte:

- `aoi.test.js`: 11 testes;
- `episodeDetector.test.js`: 11 testes;
- `exportData.test.js`: 8 testes;
- `metrics.test.js`: 7 testes;
- `calibration.test.js`: 12 testes.

Não há testes automatizados diretos para o serviço de câmera, MediaPipe, interface DOM, visualizações Canvas/SVG, armazenamento, downloads e fluxo de ponta a ponta.

### Build

Comando: `npm run build`  
Resultado: **concluído com sucesso pelo Vite 5.4.21**, com 20 módulos transformados e saída em `dist/`.

### Teste manual informado pelo autor

O autor relatou o funcionamento da calibração e a execução do fluxo no Chrome e no Opera. Essa evidência é descrita como **teste funcional manual do autor**, não como validação científica. Não foram fornecidas medições de erro, acurácia, repetibilidade, sensibilidade ou comparação com equipamento de referência.

## 5. Segurança, privacidade e LGPD

### Medidas implementadas

- permissão explícita antes do uso da câmera;
- restrição da solicitação a vídeo;
- processamento pretendido no navegador;
- ausência, no código inspecionado, de backend, login, analytics ou transmissão programada de vídeo e coordenadas;
- vídeo não gravado pelo código da aplicação;
- amostras brutas mantidas em memória até download explícito;
- arquivos CSV/JSON baixados passam a ficar sob responsabilidade do usuário e podem conter dados comportamentais pseudonimizados;
- resumo local sem coordenadas e sem código do participante;
- botão para encerrar a câmera;
- recursos WebGazer/MediaPipe servidos pela própria origem.

Essas medidas se alinham aos princípios de finalidade, necessidade, segurança e prevenção, mas **não constituem parecer jurídico nem comprovam conformidade integral à LGPD**.

### Pendências e limitações

- o código de sessão e os arquivos CSV/JSON devem ser tratados como dados comportamentais potencialmente identificáveis ou pseudonimizados;
- o encerramento normal da leitura não chama `tracker.end()` em todos os caminhos; a câmera pode permanecer ativa até retorno ao início ou comando explícito;
- a eficácia do desligamento em todos os navegadores não tem teste automatizado;
- `npm audit`, executado em 18 nov. 2026, apontou seis alertas na cadeia de ferramentas Vite/Vitest: três moderados, um alto e dois críticos. As correções propostas exigem atualizações de versão principal, que não foram aplicadas nesta tarefa para não alterar o software sem avaliação de compatibilidade.

## 6. Limitações métricas identificadas

- a cobertura é calculada sobre classificações registradas, não sobre todas as amostras esperadas durante lacunas prolongadas;
- o tempo dentro/fora é aproximado por contagem multiplicada por 100 ms;
- a duração apresentada nas métricas é derivada da primeira e da última amostra, podendo diferir do cronômetro integral;
- o temporizador automático do modo prolongado usa tempo de relógio e pode continuar durante pausas;
- episódios confirmados e interrompidos sem retorno aparecem no JSON, mas não entram em todos os agregados exibidos;
- as visualizações não possuem testes automatizados e podem sofrer distorção se a janela for redimensionada durante a sessão.

O TCC apresenta essas limitações para evitar conclusões além do que o código sustenta.

## 7. Participação da ferramenta de inteligência artificial

A ferramenta Kiro apoiou a geração e alteração de código, organização dos arquivos, elaboração de testes, investigação dos erros de integração e preparação inicial da redação, referências, figuras e arquivos DOCX/PDF. O autor definiu os requisitos, orientou as correções e forneceu os resultados dos testes manuais. As saídas foram confrontadas com o código, executadas quando possível e submetidas a revisão independente. A revisão acadêmica e a decisão sobre a versão submetida permanecem sob responsabilidade do autor e do orientador.

## 8. Referências

As 12 referências do artigo foram verificadas em páginas oficiais, índices acadêmicos, DOI e documentação primária. A rastreabilidade completa está em `Referencias_Verificadas.md`. Foram omitidos dados bibliográficos que não puderam ser confirmados de forma consistente.

## 9. Lista final de conformidade

### Conformidade acadêmica

- [x] Documentos institucionais fornecidos considerados.
- [x] Estrutura de artigo técnico compatível com o modelo TCC II.
- [x] Metodologia explica decisões e limitações.
- [x] Objetivo alinhado ao software real.
- [x] Conclusão responde ao objetivo sem extrapolação clínica.
- [ ] Data de aprovação e banca: aguardam definição.
- [ ] Ficha catalográfica: deve ser gerada no sistema do ICT/Unifesp e substituir o marcador.

### Integridade científica

- [x] Referências verificáveis e rastreadas.
- [x] DOI conferidos quando disponíveis.
- [x] Nenhum dado quantitativo experimental inventado.
- [x] Funcionalidades planejadas não foram apresentadas como concluídas.
- [x] Limitações explícitas.
- [x] Participação do Kiro descrita com transparência.
- [x] Esta versão não utiliza resultados de pesquisa com participantes; eventual estudo futuro deverá ser avaliado com o orientador e o CEP competente.

### Qualidade técnica

- [x] Arquitetura conferida com o código.
- [x] Testes automatizados executados nesta entrega.
- [x] Build executado nesta entrega.
- [x] Medidas de privacidade descritas sem alegação de conformidade integral.
- [x] Alertas de dependências registrados.
- [ ] Comparação com rastreador laboratorial: não realizada.
- [ ] Avaliação quantitativa de precisão e repetibilidade: não realizada.

### Documento final

- [x] Word editável gerado com Times New Roman, margens e colunas configuradas.
- [x] PDF de prévia gerado para conferir paginação (não é o PDF institucional definitivo).
- [x] Formatação de página, margens, colunas, títulos, figuras e referências aplicada programaticamente.
- [x] O PDF de prévia contém quatro páginas preliminares e cinco páginas de artigo.
- [x] Resumo e abstract abaixo de 300 palavras.
- [x] Até cinco palavras-chave.
- [ ] Conferência visual final no Microsoft Word: deve ser feita pelo autor, pois a renderização pode variar entre versões e sistemas.
- [ ] PDF definitivo em Times New Roman: exportar pelo Microsoft Word após completar banca e ficha catalográfica.

## 10. Parecer final

O documento constitui uma minuta técnica consistente, não uma versão pronta para submissão institucional. O autor e o orientador devem revisar a redação, completar data, banca e ficha catalográfica e exportar o PDF definitivo pelo Microsoft Word. A ausência de validação quantitativa e comparação com equipamento de referência não invalida o caráter de desenvolvimento tecnológico, mas limita as conclusões à implementação, aos testes automatizados e ao teste funcional manual relatado pelo autor.