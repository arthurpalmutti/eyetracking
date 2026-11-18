from __future__ import annotations

import os
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Mm, Pt

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    Image as RLImage,
    KeepTogether,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
FIG_DIR = ROOT / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)
DOCX_PATH = ROOT / "TCC_II_Engenharia_Biomedica.docx"
PDF_PATH = ROOT / "TCC_II_Engenharia_Biomedica_previa.pdf"

TITLE = "Desenvolvimento de uma aplicação web para rastreamento ocular durante atividades de leitura"
AUTHOR = "Arthur de Carvalho Palmutti"
ADVISOR = "Prof. Dr. Mateus Fernandes Réu Urban"
AFFILIATION = "Instituto de Ciência e Tecnologia da Universidade Federal de São Paulo / Engenharia Biomédica"
CITY = "São José dos Campos, SP"
YEAR = "2026"

RESUMO = (
    "Este trabalho apresenta o desenvolvimento de uma aplicação web para estimar a posição do olhar durante atividades de leitura, utilizando webcam convencional e a biblioteca WebGazer.js 3.5.3. O protótipo, denominado Olhar em Leitura, foi organizado em módulos de aquisição, processamento, interface e exportação. Após consentimento operacional, o usuário realiza calibração em nove pontos e verificação em cinco alvos. As previsões são amostradas nominalmente a 10 Hz, filtradas por mediana móvel de três pontos para classificação geométrica e comparadas com uma área de interesse correspondente ao contêiner de leitura. O sistema distingue amostras válidas, ausentes e atípicas; confirma afastamentos após 1.000 ms fora da área e retornos após 300 ms dentro dela. Foram implementados dois modos de leitura, relatório visual e exportação em CSV e JSON. A suíte automatizada apresentou 49 testes aprovados, e o pacote de produção foi gerado com Vite 5.4.21. O autor relatou a execução funcional da calibração no Chrome e no Opera. A avaliação foi limitada ao teste manual do autor, sem comparação com equipamento laboratorial, análise estatística ou validação de estados cognitivos. O resultado constitui um protótipo funcional para descrição geométrica ampla do olhar, condicionado à qualidade da iluminação, calibração e câmera."
)

ABSTRACT = (
    "This work presents the development of a web application to estimate gaze position during reading activities using a conventional webcam and WebGazer.js 3.5.3. The prototype, named Olhar em Leitura, was organized into acquisition, processing, interface, and export modules. After operational consent, the user completes a nine-point calibration and a five-target verification. Predictions are nominally sampled at 10 Hz, processed with a three-point moving median for geometric classification, and compared with an area of interest corresponding to the reading container. The system distinguishes valid, missing, and outlier samples; it confirms departures after 1,000 ms outside the area and returns after 300 ms inside it. Two reading modes, a visual report, and CSV/JSON export were implemented. The automated suite passed 49 tests, and a production package was built with Vite 5.4.21. The author reported functional execution of the calibration in Chrome and Opera. Evaluation was limited to the author's manual test, without comparison with laboratory equipment, statistical analysis, or validation of cognitive states. The result is a functional prototype for broad geometric description of gaze, whose use depends on lighting, calibration, and camera conditions."
)

KEYWORDS = "Rastreamento ocular, visão computacional, aplicação web, leitura, webcam."
EN_KEYWORDS = "Eye tracking, computer vision, web application, reading, webcam."

SECTIONS = [
    ("I. INTRODUÇÃO", [
        "A leitura envolve uma sequência de fixações, sacadas e regressões que varia conforme o texto, a tarefa e o leitor. O registro desses movimentos oferece uma forma de observar como a informação visual é amostrada ao longo do tempo [1]. Equipamentos infravermelhos de laboratório realizam esse registro com elevada taxa de aquisição e controle geométrico, mas têm custo e requisitos de instalação que limitam seu uso em aplicações educacionais ou domésticas.",
        "A evolução da visão computacional permitiu estimar a direção do olhar com câmeras integradas a computadores pessoais. O WebGazer foi proposto como uma biblioteca executada no navegador que associa características oculares extraídas do vídeo a posições conhecidas da página, usando interações do usuário para calibração [2]. A alternativa reduz a necessidade de hardware especializado e facilita a distribuição de protótipos, embora preserve limitações de iluminação, resolução, movimento da cabeça e heterogeneidade entre usuários.",
        "Comparações recentes indicam que sistemas específicos baseados em webcam podem produzir medidas úteis em determinadas tarefas, mas os resultados dependem do método, do ambiente e do algoritmo. Kaduk et al. compararam uma plataforma própria com o EyeLink 1000 e encontraram desempenho promissor para tarefas amplas [3]. Serrano-Carot et al. observaram viabilidade para pesquisa de leitura, acompanhada de maior ruído e necessidade de mais observações do que em rastreadores de alta precisão [4]. Hutt et al. empregaram o WebGazer em uma tarefa de leitura e compreensão [5]. Esses resultados não autorizam transferir valores de acurácia entre plataformas nem inferir atenção diretamente a partir de coordenadas.",
        "O problema de engenharia abordado neste trabalho foi desenvolver uma ferramenta acessível que registrasse estimativas de posição do olhar durante a leitura de conteúdo exibido no próprio navegador. A aplicação deveria distinguir olhar dentro e fora de uma área de interesse, perdas de rastreamento e pontos numericamente atípicos; reduzir oscilações breves; identificar afastamentos sustentados; e produzir dados exportáveis. O objetivo foi desenvolver e verificar funcionalmente um protótipo web para caracterização geométrica ampla do comportamento visual durante a leitura, sem pretensão diagnóstica ou equivalência com um rastreador laboratorial.",
        "A expressão “afastamento visual” é usada neste artigo em sentido estritamente operacional: uma coordenada válida permaneceu fora do retângulo de leitura por um intervalo configurado. O evento pode decorrer de pausa, reflexão, movimento corporal, consulta a outro elemento ou erro de estimativa. Portanto, não é tratado como sinônimo de desatenção. Essa delimitação orientou a arquitetura, as métricas e a apresentação dos resultados."
    ]),
    ("II. MATERIAL E MÉTODOS", []),
]

METHOD_SUBSECTIONS = [
    ("A. Caracterização e escopo", [
        "O trabalho foi conduzido como desenvolvimento tecnológico de um protótipo executado localmente no navegador. A implementação utiliza JavaScript em módulos ES, HTML e CSS próprios. Não há servidor de aplicação, autenticação, banco de dados remoto ou gravação de vídeo. O Vite 5 foi adotado como ambiente de desenvolvimento e empacotamento por oferecer servidor local, resolução de módulos e geração de arquivos estáticos de produção [6].",
        "O software possui dois fluxos. No modo A, o sistema apresenta um texto pré-carregado, calibra o rastreador, registra a leitura e exibe um questionário de compreensão somente após a coleta. A implementação atual utiliza automaticamente o primeiro texto disponível, sem tela de escolha nesse modo. No modo B, denominado sessão prolongada ou leitura livre, o usuário escolhe um texto ou cola conteúdo próprio e define duração de 5, 10, 15, 20 ou 30 minutos. Em ambos os casos, o conteúdo deve permanecer na área de leitura da aplicação. O código pausa a sessão quando a aba é ocultada; logo, o protótipo não monitora outros aplicativos, documentos externos ou outras abas."
    ]),
    ("B. Arquitetura e tecnologias", [
        "A arquitetura separa a dependência de rastreamento da lógica de processamento. O módulo gazeTracker.js é o único ponto que acessa o objeto global do WebGazer. O session.js coordena relógio, amostragem e classificação. Funções puras em coordinateMapper.js, aoi.js, episodeDetector.js e metrics.js tratam coordenadas, área de interesse, episódios e indicadores. A interface e as visualizações ficam em módulos próprios; exportData.js gera CSV e JSON; storage.js mantém somente preferências e resumos. A Fig. 1 sintetiza esse fluxo.",
        "Foi fixada a versão 3.5.3 do WebGazer, disponibilizada em fevereiro de 2026 como a última versão oficialmente planejada [7]. Sua API fornece inicialização, listener de previsões, pausa, retomada, encerramento e controles de visualização [8]. Na versão utilizada, o rastreamento facial depende do MediaPipe FaceMesh. O pacote UMD do WebGazer e os arquivos locais do MediaPipe são copiados para a pasta pública durante desenvolvimento e build, evitando transformação dos binários e chamadas a uma rede de terceiros durante a inferência.",
        "A escolha por navegador e webcam convencional reduz a barreira de hardware e permite execução em localhost. Essa decisão transfere parte da variabilidade para o ambiente: exposição, posição da câmera, contraste facial, movimento e desempenho do computador podem alterar a disponibilidade e a dispersão das previsões. Por isso, a área analisada é um retângulo amplo, e não palavras ou fixações individuais."
    ]),
    ("C. Aquisição, calibração e processamento", [
        "O acesso à câmera ocorre apenas após o aceite do aviso operacional apresentado na tela inicial e um clique para iniciar a calibração. Esse aceite autoriza o recurso da aplicação, mas não substitui um termo de consentimento de pesquisa. O serviço solicita getUserMedia com vídeo habilitado e áudio desabilitado. Essa API requer permissão do usuário e contexto seguro; localhost é aceito para desenvolvimento [9]. O primeiro stream é usado como prova de permissão e encerrado imediatamente; o WebGazer passa a controlar o stream operacional.",
        "A calibração apresenta nove pontos em uma grade 3 × 3 distribuída entre margens de 10% da janela. O participante olha e clica em cada alvo, permitindo ao WebGazer associar características faciais e oculares à posição conhecida. Em seguida, cinco alvos são mostrados sem clique. Para cada alvo, o sistema coleta previsões por cerca de 1,2 s, calcula as medianas de x e y, mede a distância euclidiana até o centro do alvo e apresenta a mediana dos cinco erros. O valor é uma verificação aproximada em pixels; não representa precisão clínica. Menos de cinco previsões por alvo ou erro mediano a partir de 150 px gera aviso não bloqueante.",
        "As previsões do listener são reduzidas para aproximadamente uma amostra a cada 100 ms, usando performance.now() como relógio monotônico. Cada registro contém tempo ativo, data ISO, coordenadas brutas, coordenadas filtradas, estado e dimensões do viewport. Valores nulos são classificados como missing. Coordenadas não finitas ou além de uma tolerância de 200 px ao redor do viewport são classificadas como outlier. Nenhum desses estados é contado como olhar fora.",
        "Para a classificação geométrica, aplica-se mediana móvel às três últimas previsões válidas. As coordenadas brutas são preservadas para exportação. O ponto filtrado é comparado ao retângulo retornado por getBoundingClientRect() da área visível de leitura. Pontos entre os limites esquerdo/direito e superior/inferior são inside; os demais pontos válidos são outside. A área tem rolagem interna e seu retângulo é recalculado quando a janela é redimensionada."
    ]),
    ("D. Episódios, métricas e visualizações", [
        "Uma máquina de estados confirma um episódio quando a sequência outside atinge 1.000 ms. O início é retroagido à primeira amostra da sequência. O retorno só é aceito após 300 ms consecutivos inside, e seu início define o fim operacional do episódio. Perda de rastreamento, pausa ou aba oculta interrompe a sequência para evitar união artificial. Os limiares foram definidos como parâmetros iniciais de engenharia para rejeitar oscilações curtas; não foram derivados de estudo clínico.",
        "A cobertura é a razão entre classificações válidas e classificações registradas. Tempos dentro e fora são aproximados pela contagem multiplicada por 100 ms. Percentuais usam apenas amostras válidas. O relatório inclui contagens, percentuais, episódios com retorno, média, mediana, maior duração, latência de retorno e perdas. Cobertura inferior a 70% produz aviso operacional. Linha do tempo em SVG, mapa de ocupação e trajetória em Canvas apresentam os dados sem preencher lacunas. CSV e JSON são gerados localmente; o questionário de compreensão permanece em campo e seção separados."
    ]),
    ("E. Privacidade, segurança e participação da IA", [
        "O projeto procurou aplicar minimização e finalidade: não solicita nome, e-mail ou documento; permite código pseudônimo opcional; e não solicita microfone. A implementação inspecionada não contém backend, analytics nem transmissão programada de vídeo ou coordenadas. As amostras completas permanecem em memória até download explícito, após o qual os arquivos ficam sob responsabilidade do usuário. O histórico local contém somente resumos sanitizados. Tais medidas se relacionam aos princípios de finalidade, necessidade, segurança e prevenção da Lei Geral de Proteção de Dados [10] e às orientações da ANPD para estudos acadêmicos [11], mas não constituem avaliação jurídica de conformidade.",
        "A ferramenta de inteligência artificial Kiro foi utilizada como apoio à criação e modificação de código, organização dos arquivos, elaboração dos testes, investigação de falhas e preparação inicial da redação, referências, figuras e arquivos DOCX/PDF. O autor definiu requisitos, orientou correções, forneceu os resultados dos ensaios e acompanhou o desenvolvimento no hardware disponível. As sugestões geradas não foram consideradas corretas por origem: passaram por testes automatizados, build, inspeção do código, verificação de fontes e tentativas manuais. A responsabilidade pelas decisões, revisão acadêmica e versão submetida permanece com o autor e o orientador.",
        "Como o protótipo trata imagens da câmera e coordenadas comportamentais, uma coleta científica futura deve atender às exigências institucionais e éticas aplicáveis. A Resolução CNS nº 466/2012 estabelece diretrizes para pesquisas envolvendo seres humanos [12]. Qualquer estudo posterior deve ter seu enquadramento confirmado com o orientador e, quando aplicável, com o CEP competente."
    ]),
    ("F. Procedimentos de verificação", [
        "A verificação técnica combinou inspeção do repositório, testes unitários, build e teste manual pelo autor. A suíte Vitest abrange classificação da AOI, filtro mediano, limiares de episódio, interrupções, métricas, calibração e serialização. O build foi executado com Vite. O autor relatou a execução do fluxo com câmera e da calibração no Chrome e no Opera. Não foram produzidos valores consolidados de erro, acurácia, sensibilidade ou especificidade. O procedimento de uso é apresentado na Fig. 2."
    ]),
]

RESULTS = [
    ("III. RESULTADOS", [
        "O protótipo resultante apresenta cinco etapas: início e consentimento operacional; seleção do modo; preparação, calibração e verificação; leitura; e relatório. Foram implementados controles de fonte, contraste, visualização da webcam e ponto estimado. O modo A utiliza automaticamente o primeiro texto original disponível e apresenta perguntas de múltipla escolha; o modo B aceita texto próprio limitado a 20.000 caracteres. O relatório oferece métricas, linha do tempo, mapa de ocupação, trajetória e downloads CSV/JSON.",
        "Na execução realizada em 18 de novembro de 2026, os cinco arquivos de teste foram aprovados, totalizando 49 casos sem falha. A distribuição foi: 11 testes de AOI, 11 de episódios, 8 de exportação, 7 de métricas e 12 de calibração. O comando npm run build também foi concluído pelo Vite 5.4.21, com 20 módulos transformados e geração da pasta dist. Esses resultados demonstram consistência das funções exercitadas, mas não cobrem o serviço de câmera, o DOM, Canvas/SVG, armazenamento ou o fluxo ponta a ponta.",
        "O autor relatou a execução do fluxo com câmera e da calibração no Google Chrome e no Opera. Esses testes manuais confirmam somente que o caminho funcional pôde ser executado nas duas configurações utilizadas pelo autor. Não foram preservados registros quantitativos de erro, cobertura, repetibilidade ou desempenho por navegador; portanto, não se realizou comparação estatística ou avaliação de usabilidade.",
        "Durante o desenvolvimento, a inicialização apresentou erros minificados sucessivos. A investigação mostrou que os arquivos do MediaPipe FaceMesh não eram servidos no caminho esperado. A configuração final passou a copiar o pacote UMD e doze arquivos do MediaPipe para a origem local e a definir explicitamente o caminho da solução antes de begin(). Após essa correção, o autor informou funcionamento da calibração nos dois navegadores. O histórico é relevante porque mostra que build bem-sucedido e existência dos métodos da API não substituem ensaio com câmera real."
    ]),
]

DISCUSSION = [
    ("IV. DISCUSSÃO", [
        "A aplicação atingiu o objetivo de integrar aquisição por webcam, calibração, classificação geométrica e relatório em um fluxo de navegador. A separação entre o serviço WebGazer e as funções puras facilitou testes determinísticos. A decisão de usar uma AOI retangular e episódios sustentados é compatível com a variabilidade descrita para rastreamento por webcam [3], [4]; tentar localizar cada palavra ou medir microssacadas produziria uma precisão aparente não sustentada pelo hardware e pelo método.",
        "Os testes manuais relatados mostram que a calibração pôde ser iniciada no Chrome e no Opera nas configurações utilizadas pelo autor, mas não demonstram desempenho geral ou equivalência entre navegadores. As condições de iluminação, distância, câmera e movimento não foram variadas sistematicamente. Uma avaliação quantitativa futura deveria incluir alvos conhecidos, repetição em diferentes regiões da tela, registro das condições ambientais, maior número de participantes e comparação com rastreador de referência.",
        "A interpretação também deve permanecer limitada. Trabalhos anteriores usaram sinais de webcam em tarefas de leitura [5], mas a inferência de estados mentais depende de desenho experimental e variáveis adicionais. Neste protótipo, olhar fora significa somente que uma coordenada válida ultrapassou o retângulo. Olhar dentro tampouco comprova compreensão. O questionário posterior é complementar e não modifica as métricas oculares.",
        "A auditoria identificou restrições do cálculo atual. A cobertura usa classificações registradas, de modo que uma lacuna longa sem callbacks pode ser representada por menos eventos do que o número esperado a 10 Hz. Os tempos são aproximações por contagem; a duração do relatório pode diferir do cronômetro integral; o temporizador do modo prolongado segue tempo de relógio durante pausas; e episódios interrompidos sem retorno não entram em todos os agregados. Esses pontos não impedem o uso demonstrativo, mas devem ser corrigidos antes de análise comparativa.",
        "O ciclo da câmera também exige atenção: existe comando explícito de encerramento, porém o término normal da leitura não chama o encerramento em todos os caminhos. A interface informa a câmera ativa, mas testes futuros devem conferir o indicador físico após finalizar, voltar ao início e negar permissões. A auditoria npm encontrou seis alertas na cadeia Vite/Vitest — dois críticos, um alto e três moderados — com correções que exigem atualização de versão principal. Os avisos se concentram em ferramentas de desenvolvimento e não demonstram exploração no protótipo, mas impedem afirmar ausência de vulnerabilidades.",
        "Por fim, o uso de processamento local, ausência de backend e minimização de campos reduzem a exposição, sem garantir conformidade integral à LGPD. Coordenadas, códigos de sessão e respostas podem ser dados pessoais ou pseudonimizados quando associados a um participante. Um estudo formal precisa definir base legal, termo de consentimento, retenção, controle de acesso, descarte e análise do Comitê de Ética."
    ]),
    ("V. CONCLUSÃO", [
        "Foi desenvolvido um protótipo web capaz de obter estimativas de olhar por webcam, calibrar o usuário, classificar coordenadas em relação a uma área de leitura, distinguir perdas de rastreamento e gerar indicadores, visualizações e arquivos exportáveis. Os 49 testes unitários e o build aprovado sustentam as funções exercitadas. O autor relatou a execução do fluxo e da calibração no Chrome e no Opera, sem avaliação quantitativa de desempenho.",
        "O resultado atende ao objetivo como desenvolvimento tecnológico que permite executar o protótipo sem adquirir um rastreador ocular especializado, desde que suas saídas sejam interpretadas como descrições geométricas aproximadas. O sistema não mede atenção, não diagnostica condições e não substitui equipamento laboratorial. Como trabalhos futuros, recomendam-se correção das limitações temporais e do ciclo da câmera, atualização segura das dependências e estudo quantitativo aprovado ou dispensado pela instância ética competente, com maior número de participantes, condições controladas de iluminação e comparação com referência."
    ]),
    ("AGRADECIMENTOS", [
        "O autor agradece ao orientador, Prof. Dr. Mateus Fernandes Réu Urban, pelo acompanhamento acadêmico e à Universidade Federal de São Paulo pela formação e infraestrutura institucional."
    ]),
]

REFERENCES = [
    "[1] K. Rayner, “Eye movements in reading and information processing: 20 years of research,” Psychological Bulletin, vol. 124, no. 3, pp. 372–422, 1998. DOI 10.1037/0033-2909.124.3.372.",
    "[2] A. Papoutsaki, P. Sangkloy, J. Laskey, N. Daskalova, J. Huang e J. Hays, “WebGazer: Scalable Webcam Eye Tracking Using User Interactions,” Proc. 25th Int. Joint Conf. Artificial Intelligence (IJCAI-16), 2016. DOI 10.5555/3061053.3061156.",
    "[3] T. Kaduk, C. Goeke, H. Finger e P. König, “Webcam eye tracking close to laboratory standards: Comparing a new webcam-based system and the EyeLink 1000,” Behavior Research Methods, vol. 56, pp. 5002–5022, 2024. DOI 10.3758/s13428-023-02141-7.",
    "[4] M. Serrano-Carot, B. Angele, H. Xu e M. R. Vasilev, “Webcams can be used to study eye movements during reading,” Behavior Research Methods, 2026. DOI 10.3758/s13428-026-03199-3.",
    "[5] S. Hutt, A. Wong, A. Papoutsaki, R. S. Baker, J. I. Gold e C. Mills, “Webcam-based eye tracking to detect mind wandering and comprehension errors,” Behavior Research Methods, 2024. DOI 10.3758/s13428-022-02040-x.",
    "[6] Vite, “Getting Started.” Disponível: https://vite.dev/guide/. Acesso: 18 nov. 2026.",
    "[7] Brown WebGazer Team, “WebGazer.js — Releases, versão 3.5.3,” 2026. Disponível: https://github.com/brownhci/WebGazer/releases. Acesso: 18 nov. 2026.",
    "[8] Brown WebGazer Team, “WebGazer.js — Top Level API.” Disponível: https://github.com/brownhci/WebGazer/wiki/Top-Level-API. Acesso: 18 nov. 2026.",
    "[9] MDN Web Docs, “MediaDevices: getUserMedia() method.” Disponível: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia. Acesso: 18 nov. 2026.",
    "[10] Brasil, Lei nº 13.709, de 14 de agosto de 2018, Lei Geral de Proteção de Dados Pessoais. Disponível: https://legis.senado.leg.br/norma/27457334. Acesso: 18 nov. 2026.",
    "[11] Autoridade Nacional de Proteção de Dados, “Guia orientativo: Tratamento de dados pessoais para fins acadêmicos e para a realização de estudos e pesquisas.” Disponível: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-tratamento-de-dados-pessoais-para-fins-academicos-e-para-a-realizacao-de-estudos-e-pesquisas. Acesso: 18 nov. 2026.",
    "[12] Brasil, Conselho Nacional de Saúde, Resolução nº 466, de 12 de dezembro de 2012. Disponível: https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2012/resolucao-no-466.pdf/view. Acesso: 18 nov. 2026."
]

MODULE_ROWS = [
    ("Módulo", "Função principal"),
    ("gazeTracker.js", "Câmera, WebGazer e MediaPipe"),
    ("session.js", "Relógio, amostragem e perdas"),
    ("aoi.js / coordinateMapper.js", "Filtro e classificação geométrica"),
    ("episodeDetector.js / metrics.js", "Episódios e indicadores"),
    ("screens.js / charts.js / heatmap.js", "Interface e visualizações"),
    ("exportData.js / storage.js", "Downloads e resumos locais"),
]

TEST_ROWS = [
    ("Verificação", "Resultado", "Limite"),
    ("Vitest", "49/49 aprovados", "Sem câmera/DOM"),
    ("Build Vite", "Concluído", "Geração estática"),
    ("Chrome", "Calibração executada", "Relato do autor"),
    ("Opera", "Calibração executada", "Relato do autor"),
    ("Assets MediaPipe", "12 arquivos no build", "Verificação estrutural"),
    ("npm audit", "6 alertas", "Cadeia Vite/Vitest"),
]


def load_font(size: int, bold: bool = False):
    candidates = [
        "/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


def multiline_center(draw, box, text, font, fill=(25, 35, 45), spacing=8):
    x0, y0, x1, y1 = box
    lines = []
    for part in text.split("\n"):
        lines.extend(wrap(part, width=28) or [""])
    heights = [draw.textbbox((0, 0), line, font=font)[3] for line in lines]
    total = sum(heights) + spacing * (len(lines) - 1)
    y = y0 + (y1 - y0 - total) / 2
    for line, h in zip(lines, heights):
        bb = draw.textbbox((0, 0), line, font=font)
        x = x0 + (x1 - x0 - (bb[2] - bb[0])) / 2
        draw.text((x, y), line, font=font, fill=fill)
        y += h + spacing


def arrow(draw, start, end, color=(43, 103, 119), width=8):
    draw.line([start, end], fill=color, width=width)
    x2, y2 = end
    x1, y1 = start
    import math
    angle = math.atan2(y2-y1, x2-x1)
    size = 22
    a1 = angle + math.pi * 0.84
    a2 = angle - math.pi * 0.84
    pts = [(x2, y2), (x2 + size*math.cos(a1), y2 + size*math.sin(a1)), (x2 + size*math.cos(a2), y2 + size*math.sin(a2))]
    draw.polygon(pts, fill=color)


def make_architecture_figure():
    path = FIG_DIR / "figura_1_arquitetura.png"
    img = Image.new("RGB", (1400, 980), "white")
    d = ImageDraw.Draw(img)
    title = load_font(38, True)
    boxfont = load_font(30, True)
    small = load_font(25)
    d.text((700, 35), "Arquitetura do protótipo", font=title, fill=(17, 55, 68), anchor="ma")
    boxes = [
        ((70, 150, 360, 370), "Usuário e interface\nHTML/CSS/JS", (228, 242, 244)),
        ((450, 150, 740, 370), "Webcam\nWebGazer 3.5.3\nMediaPipe FaceMesh", (235, 239, 249)),
        ((830, 150, 1330, 370), "Pipeline de sessão\n10 Hz • coordenadas • filtro\nAOI: inside/outside/missing/outlier", (233, 246, 239)),
        ((170, 560, 600, 800), "Análise\nEpisódios 1000/300 ms\nMétricas descritivas", (252, 243, 225)),
        ((790, 560, 1230, 800), "Saída local\nRelatório • SVG/Canvas\nCSV/JSON • resumo local", (246, 234, 241)),
    ]
    for box, text, color in boxes:
        d.rounded_rectangle(box, radius=25, fill=color, outline=(55, 91, 101), width=4)
        multiline_center(d, box, text, boxfont if "Usuário" in text else small)
    arrow(d, (360, 260), (450, 260))
    arrow(d, (740, 260), (830, 260))
    arrow(d, (1080, 370), (500, 560))
    arrow(d, (600, 680), (790, 680))
    d.text((700, 900), "Na implementação inspecionada, o código não armazena nem transmite vídeo", font=small, fill=(75, 75, 75), anchor="ma")
    img.save(path, quality=95)
    return path


def make_flow_figure():
    path = FIG_DIR / "figura_2_procedimento.png"
    img = Image.new("RGB", (1050, 1500), "white")
    d = ImageDraw.Draw(img)
    title = load_font(38, True)
    font = load_font(28, True)
    note = load_font(24)
    d.text((525, 35), "Procedimento de uso e verificação", font=title, fill=(17, 55, 68), anchor="ma")
    labels = [
        "Aceite operacional e código pseudônimo",
        "Escolha: teste de leitura ou sessão prolongada",
        "Permissão de vídeo e enquadramento",
        "Calibração: 9 pontos com clique",
        "Verificação: 5 alvos sem clique",
        "Leitura dentro da AOI (≈ 10 Hz)",
        "Relatório e exportação local",
    ]
    y = 130
    boxes = []
    for i, label in enumerate(labels):
        box = (110, y, 940, y+135)
        boxes.append(box)
        fill = (228, 242, 244) if i < 3 else (233, 246, 239) if i < 6 else (252, 243, 225)
        d.rounded_rectangle(box, radius=22, fill=fill, outline=(55, 91, 101), width=4)
        multiline_center(d, box, label, font)
        if i < len(labels)-1:
            arrow(d, (525, y+135), (525, y+185), width=7)
        y += 185
    d.text((525, 1435), "Aba oculta ou pausa interrompe a coleta até retomada explícita", font=note, fill=(90, 70, 45), anchor="ma")
    img.save(path, quality=95)
    return path


def set_cell_text(cell, text, size=8, bold=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(text)
    r.bold = bold
    r.font.name = "Times New Roman"
    r.font.size = Pt(size)
    r._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_columns(section, num=1, space_twips=340):
    sectPr = section._sectPr
    cols = sectPr.find(qn("w:cols"))
    if cols is None:
        cols = OxmlElement("w:cols")
        sectPr.append(cols)
    cols.set(qn("w:num"), str(num))
    if num > 1:
        cols.set(qn("w:space"), str(space_twips))
        cols.set(qn("w:equalWidth"), "1")


def set_mirror_margins(section):
    sectPr = section._sectPr
    if sectPr.find(qn("w:mirrorMargins")) is None:
        sectPr.append(OxmlElement("w:mirrorMargins"))


def set_page_layout(section):
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(4.0)
    section.left_margin = Cm(1.9)
    section.right_margin = Cm(1.4)
    section.header_distance = Cm(1.0)
    section.footer_distance = Cm(1.5)
    set_mirror_margins(section)


def add_page_number(section, start=1):
    section.footer.is_linked_to_previous = False
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    p._p.append(fld)
    pg = OxmlElement("w:pgNumType")
    pg.set(qn("w:start"), str(start))
    section._sectPr.append(pg)


def set_run_font(run, size=10, bold=False, italic=False):
    run.font.name = "Times New Roman"
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic


def add_body_paragraph(doc, text, size=10, first_indent=True, space_after=0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    if first_indent:
        p.paragraph_format.first_line_indent = Mm(4)
    r = p.add_run(text)
    set_run_font(r, size=size)
    return p


def add_main_heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.keep_with_next = True
    first, rest = text[0], text[1:]
    r1 = p.add_run(first)
    set_run_font(r1, size=12)
    r2 = p.add_run(rest.upper())
    set_run_font(r2, size=8)
    return p


def add_sub_heading(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(15)
    p.paragraph_format.space_after = Pt(7.5)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    set_run_font(r, size=10, italic=True)
    return p


def add_caption(doc, text, above=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(15 if above else 5)
    p.paragraph_format.space_after = Pt(5 if above else 15)
    p.paragraph_format.keep_with_next = above
    r = p.add_run(text)
    set_run_font(r, size=8)
    return p


def add_docx_table(doc, rows, widths):
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for i, row in enumerate(rows):
        for j, text in enumerate(row):
            set_cell_text(table.cell(i, j), text, size=8, bold=(i == 0))
            table.cell(i, j).width = widths[j]
    return table


def add_centered_text(doc, text, size, bold=False, space_after=0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(text)
    set_run_font(r, size=size, bold=bold)
    return p


def make_docx(fig1, fig2):
    doc = Document()
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.font.size = Pt(10)
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    normal.paragraph_format.space_after = Pt(0)

    for section in doc.sections:
        set_page_layout(section)
        set_columns(section, 1)

    # Capa
    add_centered_text(doc, "UNIVERSIDADE FEDERAL DE SÃO PAULO", 12, True)
    add_centered_text(doc, "INSTITUTO DE CIÊNCIA E TECNOLOGIA", 12, True)
    add_centered_text(doc, "GRADUAÇÃO EM ENGENHARIA BIOMÉDICA", 12, True)
    doc.add_paragraph("\n\n\n\n")
    add_centered_text(doc, TITLE.upper(), 14, True)
    doc.add_paragraph("\n\n")
    add_centered_text(doc, f"Aluno: {AUTHOR}", 12)
    add_centered_text(doc, f"Orientador: {ADVISOR}", 12)
    doc.add_paragraph("\n\n\n\n\n")
    add_centered_text(doc, CITY, 10)
    add_centered_text(doc, YEAR, 10)

    # Folha de rosto
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_layout(sec); set_columns(sec, 1)
    add_centered_text(doc, AUTHOR.upper(), 12, True)
    doc.add_paragraph("\n\n\n")
    add_centered_text(doc, TITLE.upper(), 14, True)
    doc.add_paragraph("\n\n")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.left_indent = Cm(8.0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    r = p.add_run("Trabalho apresentado ao Instituto de Ciência e Tecnologia da Universidade Federal de São Paulo como requisito parcial para obtenção do título de graduação em Engenharia Biomédica.")
    set_run_font(r, 10)
    p2 = doc.add_paragraph()
    p2.paragraph_format.left_indent = Cm(8.0)
    r = p2.add_run(f"Orientador: {ADVISOR}")
    set_run_font(r, 10)
    doc.add_paragraph("\n\n\n\n")
    add_centered_text(doc, CITY, 10)
    add_centered_text(doc, YEAR, 10)

    # Folha de aprovação
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_layout(sec); set_columns(sec, 1)
    add_centered_text(doc, "FOLHA DE APROVAÇÃO", 12, True, 20)
    add_centered_text(doc, AUTHOR.upper(), 12, True, 20)
    add_centered_text(doc, TITLE, 14, True, 24)
    p = add_body_paragraph(doc, "Trabalho apresentado ao Instituto de Ciência e Tecnologia da Universidade Federal de São Paulo como requisito parcial para obtenção do título de graduação em Engenharia Biomédica.", first_indent=False)
    p.paragraph_format.left_indent = Cm(5)
    p.paragraph_format.right_indent = Cm(1)
    doc.add_paragraph("\n")
    add_centered_text(doc, "São José dos Campos, ____ de __________________ de 2026.", 10)
    doc.add_paragraph("\n")
    add_centered_text(doc, "Banca Avaliadora", 11, True)
    for label in [
        f"{ADVISOR}\n(Presidente — Unifesp)",
        "Prof.(a) Dr.(a) ____________________________________\n(Membro 1 — ____________________)",
        "Prof.(a) Dr.(a) ____________________________________\n(Membro 2 — ____________________)",
    ]:
        doc.add_paragraph("\n")
        add_centered_text(doc, label, 10)

    # Ficha catalográfica
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_layout(sec); set_columns(sec, 1)
    doc.add_paragraph("\n\n\n\n\n\n")
    add_centered_text(doc, "SUBSTITUIR PELA FICHA CATALOGRÁFICA", 12, True, 12)
    add_centered_text(doc, "Gerar em: http://ict.unifesp.br/ficha/ficha_grad.php", 10)

    # Cabeçalho do artigo em uma coluna
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_layout(sec); set_columns(sec, 1); add_page_number(sec, 1)
    add_centered_text(doc, TITLE, 14, True, 8)
    add_centered_text(doc, f"{AUTHOR}¹, {ADVISOR}¹", 12, False, 10)
    add_centered_text(doc, f"¹ {AFFILIATION}", 9, False, 20)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run("Resumo — "); set_run_font(r, 9, True)
    r = p.add_run(RESUMO); set_run_font(r, 9)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY; p.paragraph_format.space_after = Pt(5)
    r = p.add_run("Abstract — "); set_run_font(r, 9, True)
    r = p.add_run(ABSTRACT); set_run_font(r, 9)
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(3)
    r = p.add_run("Palavras-chave — "); set_run_font(r, 9, True)
    r = p.add_run(KEYWORDS); set_run_font(r, 9)
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(5)
    r = p.add_run("Keywords — "); set_run_font(r, 9, True)
    r = p.add_run(EN_KEYWORDS); set_run_font(r, 9)

    # Corpo em duas colunas, contínuo
    sec = doc.add_section(WD_SECTION.CONTINUOUS)
    set_page_layout(sec); set_columns(sec, 2)
    sec.footer.is_linked_to_previous = True

    for heading, paras in SECTIONS:
        add_main_heading(doc, heading)
        for text in paras:
            add_body_paragraph(doc, text)
        if heading.startswith("I."):
            add_caption(doc, "Tabela 1 Organização dos módulos do protótipo", above=True)
            add_docx_table(doc, MODULE_ROWS, [Cm(3.3), Cm(5.1)])

    for idx, (sub, paras) in enumerate(METHOD_SUBSECTIONS):
        add_sub_heading(doc, sub)
        for text in paras:
            add_body_paragraph(doc, text)
        if sub.startswith("B."):
            p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(str(fig1), width=Mm(80))
            add_caption(doc, "Figura. 1 Arquitetura modular e fluxo local de dados do protótipo. Fonte: elaboração própria.")
        if sub.startswith("F."):
            p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(str(fig2), width=Mm(72))
            add_caption(doc, "Figura. 2 Etapas do procedimento de uso e verificação funcional. Fonte: elaboração própria.")

    for heading, paras in RESULTS:
        add_main_heading(doc, heading)
        for i, text in enumerate(paras):
            add_body_paragraph(doc, text)
            if i == 1:
                add_caption(doc, "Tabela 2 Evidências de verificação no estado atual", above=True)
                add_docx_table(doc, TEST_ROWS, [Cm(2.7), Cm(3.0), Cm(2.7)])

    for heading, paras in DISCUSSION:
        add_main_heading(doc, heading)
        for text in paras:
            add_body_paragraph(doc, text)

    add_main_heading(doc, "REFERÊNCIAS")
    for ref in REFERENCES:
        p = add_body_paragraph(doc, ref, size=8, first_indent=False, space_after=2)
        p.paragraph_format.left_indent = Mm(0)
        p.paragraph_format.keep_together = True

    # Propriedades e campos para atualização no Word
    settings = doc.settings._element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")

    doc.core_properties.title = TITLE
    doc.core_properties.author = AUTHOR
    doc.core_properties.subject = "Trabalho de Conclusão de Curso II — Engenharia Biomédica"
    doc.core_properties.keywords = KEYWORDS
    doc.core_properties.comments = "Documento editável gerado conforme modelo institucional fornecido."
    doc.save(DOCX_PATH)


# ---------- PDF ----------

def pdf_styles():
    styles = getSampleStyleSheet()
    return {
        "cover": ParagraphStyle("cover", fontName="Times-Bold", fontSize=12, leading=15, alignment=TA_CENTER, spaceAfter=6),
        "cover_title": ParagraphStyle("cover_title", fontName="Times-Bold", fontSize=14, leading=17, alignment=TA_CENTER),
        "body": ParagraphStyle("body", fontName="Times-Roman", fontSize=10, leading=10.7, alignment=TA_JUSTIFY, firstLineIndent=4*mm, spaceAfter=1.5),
        "body_noindent": ParagraphStyle("body_noindent", fontName="Times-Roman", fontSize=10, leading=10.7, alignment=TA_JUSTIFY, spaceAfter=2),
        "main": ParagraphStyle("main", fontName="Times-Roman", fontSize=9, leading=11, alignment=TA_CENTER, spaceBefore=14, spaceAfter=7, keepWithNext=True),
        "sub": ParagraphStyle("sub", fontName="Times-Italic", fontSize=10, leading=11, alignment=TA_LEFT, spaceBefore=10, spaceAfter=5, keepWithNext=True),
        "title": ParagraphStyle("title", fontName="Times-Bold", fontSize=14, leading=16, alignment=TA_CENTER, spaceAfter=8),
        "author": ParagraphStyle("author", fontName="Times-Roman", fontSize=12, leading=14, alignment=TA_CENTER, spaceAfter=8),
        "affil": ParagraphStyle("affil", fontName="Times-Roman", fontSize=9, leading=11, alignment=TA_CENTER, spaceAfter=14),
        "abstract": ParagraphStyle("abstract", fontName="Times-Roman", fontSize=9, leading=9.8, alignment=TA_JUSTIFY, spaceAfter=5),
        "caption": ParagraphStyle("caption", fontName="Times-Roman", fontSize=8, leading=9, alignment=TA_LEFT, spaceBefore=3, spaceAfter=8),
        "tablecap": ParagraphStyle("tablecap", fontName="Times-Roman", fontSize=8, leading=9, alignment=TA_LEFT, spaceBefore=8, spaceAfter=3),
        "ref": ParagraphStyle("ref", fontName="Times-Roman", fontSize=8, leading=8.7, alignment=TA_JUSTIFY, leftIndent=0, firstLineIndent=0, spaceAfter=2),
        "small_center": ParagraphStyle("small_center", fontName="Times-Roman", fontSize=10, leading=12, alignment=TA_CENTER),
    }


def escape_pdf(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("—", "-").replace("–", "-").replace("≥", ">=").replace("≈", "~").replace("×", "x")


def make_pdf(fig1, fig2):
    styles = pdf_styles()
    page_w, page_h = A4
    top, bottom, inner, outer, gap = 25*mm, 40*mm, 19*mm, 14*mm, 6*mm
    col_w = 85.5*mm

    def prelim_page(canvas, doc):
        pass

    def article_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Times-Roman", 8)
        n = canvas.getPageNumber() - 4
        if n > 0:
            canvas.drawCentredString(page_w/2, 18*mm, str(n))
        canvas.restoreState()

    prelim_frame = Frame(inner, bottom, page_w-inner-outer, page_h-top-bottom,
                         leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
                         id="prelim", showBoundary=0)

    # Primeira página do artigo: título/resumos ocupam a largura total e o
    # corpo começa, na mesma página, nas duas colunas inferiores. Nas páginas
    # seguintes, as duas colunas mantêm largura efetiva de 85,5 mm e intervalo
    # efetivo de 6 mm, sem padding interno que altere essas medidas.
    header_h = 145*mm
    lower_h = page_h - top - bottom - header_h
    header_frame = Frame(inner, bottom+lower_h, page_w-inner-outer, header_h,
                         leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
                         id="article_header", showBoundary=0)
    first_lower_frames = [
        Frame(inner, bottom, col_w, lower_h, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="first_left"),
        Frame(inner+col_w+gap, bottom, col_w, lower_h, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="first_right"),
    ]
    odd_frames = [
        Frame(inner, bottom, col_w, page_h-top-bottom, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="odd_left"),
        Frame(inner+col_w+gap, bottom, col_w, page_h-top-bottom, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="odd_right"),
    ]
    even_left = outer
    even_frames = [
        Frame(even_left, bottom, col_w, page_h-top-bottom, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="even_left"),
        Frame(even_left+col_w+gap, bottom, col_w, page_h-top-bottom, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="even_right"),
    ]
    templates = [
        PageTemplate(id="prelim", frames=[prelim_frame], onPage=prelim_page),
        PageTemplate(id="article_first", frames=[header_frame, *first_lower_frames], onPage=article_number, autoNextPageTemplate="article_even"),
        PageTemplate(id="article_odd", frames=odd_frames, onPage=article_number, autoNextPageTemplate="article_even"),
        PageTemplate(id="article_even", frames=even_frames, onPage=article_number, autoNextPageTemplate="article_odd"),
    ]
    doc = BaseDocTemplate(str(PDF_PATH), pagesize=A4, pageTemplates=templates,
                          leftMargin=inner, rightMargin=outer, topMargin=top, bottomMargin=bottom,
                          title=TITLE, author=AUTHOR)
    story = []
    # Capa
    story += [Paragraph("UNIVERSIDADE FEDERAL DE SÃO PAULO", styles["cover"]), Paragraph("INSTITUTO DE CIÊNCIA E TECNOLOGIA", styles["cover"]), Paragraph("GRADUAÇÃO EM ENGENHARIA BIOMÉDICA", styles["cover"]), Spacer(1, 48*mm), Paragraph(escape_pdf(TITLE.upper()), styles["cover_title"]), Spacer(1, 18*mm), Paragraph(f"Aluno: {AUTHOR}", styles["cover"]), Paragraph(f"Orientador: {ADVISOR}", styles["cover"]), Spacer(1, 45*mm), Paragraph(CITY, styles["small_center"]), Paragraph(YEAR, styles["small_center"]), PageBreak()]
    # Rosto
    story += [Paragraph(AUTHOR.upper(), styles["cover"]), Spacer(1, 42*mm), Paragraph(escape_pdf(TITLE.upper()), styles["cover_title"]), Spacer(1, 18*mm), Table([["", Paragraph("Trabalho apresentado ao Instituto de Ciência e Tecnologia da Universidade Federal de São Paulo como requisito parcial para obtenção do título de graduação em Engenharia Biomédica.<br/><br/>Orientador: " + ADVISOR, styles["body_noindent"])]], colWidths=[78*mm, 85*mm], style=TableStyle([])), Spacer(1, 40*mm), Paragraph(CITY, styles["small_center"]), Paragraph(YEAR, styles["small_center"]), PageBreak()]
    # Aprovação
    story += [Paragraph("FOLHA DE APROVAÇÃO", styles["cover"]), Spacer(1, 10*mm), Paragraph(AUTHOR.upper(), styles["cover"]), Spacer(1, 8*mm), Paragraph(escape_pdf(TITLE), styles["cover_title"]), Spacer(1, 12*mm), Paragraph("Trabalho apresentado ao Instituto de Ciência e Tecnologia da Universidade Federal de São Paulo como requisito parcial para obtenção do título de graduação em Engenharia Biomédica.", styles["body_noindent"]), Spacer(1, 10*mm), Paragraph("São José dos Campos, ____ de __________________ de 2026.", styles["small_center"]), Spacer(1, 12*mm), Paragraph("<b>Banca Avaliadora</b>", styles["small_center"]), Spacer(1, 10*mm), Paragraph(ADVISOR + "<br/>(Presidente - Unifesp)", styles["small_center"]), Spacer(1, 12*mm), Paragraph("Prof.(a) Dr.(a) ____________________________________<br/>(Membro 1 - ____________________)", styles["small_center"]), Spacer(1, 12*mm), Paragraph("Prof.(a) Dr.(a) ____________________________________<br/>(Membro 2 - ____________________)", styles["small_center"]), PageBreak()]
    # Ficha
    story += [Spacer(1, 75*mm), Paragraph("SUBSTITUIR PELA FICHA CATALOGRÁFICA", styles["cover"]), Paragraph("Gerar em: http://ict.unifesp.br/ficha/ficha_grad.php", styles["small_center"]), NextPageTemplate("article_first"), PageBreak()]
    # Artigo: título/resumos em largura total; introdução começa em duas colunas
    # na mesma página por meio de FrameBreak.
    story += [Paragraph(escape_pdf(TITLE), styles["title"]), Paragraph(f"{AUTHOR}¹, {ADVISOR}¹", styles["author"]), Paragraph("¹ " + escape_pdf(AFFILIATION), styles["affil"]), Paragraph("<b>Resumo - </b>" + escape_pdf(RESUMO), styles["abstract"]), Paragraph("<b>Abstract - </b>" + escape_pdf(ABSTRACT), styles["abstract"]), Paragraph("<b>Palavras-chave - </b>" + escape_pdf(KEYWORDS), styles["abstract"]), Paragraph("<b>Keywords - </b>" + escape_pdf(EN_KEYWORDS), styles["abstract"]), FrameBreak()]

    def add_main(text): story.append(Paragraph(escape_pdf(text.upper()), styles["main"]))
    def add_sub(text): story.append(Paragraph(escape_pdf(text), styles["sub"]))
    def add_para(text): story.append(Paragraph(escape_pdf(text), styles["body"]))
    def add_table(rows, widths):
        data = [[Paragraph(escape_pdf(c), ParagraphStyle("tc", fontName="Times-Bold" if i==0 else "Times-Roman", fontSize=8, leading=8.8)) for c in row] for i,row in enumerate(rows)]
        t = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
        t.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.35,colors.black),("BACKGROUND",(0,0),(-1,0),colors.HexColor("#E4F2F4")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),2),("RIGHTPADDING",(0,0),(-1,-1),2),("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2)]))
        story.append(t)

    for heading, paras in SECTIONS:
        add_main(heading)
        for p in paras: add_para(p)
        if heading.startswith("I."):
            story.append(Paragraph("Tabela 1 Organização dos módulos do protótipo", styles["tablecap"]))
            add_table(MODULE_ROWS, [33*mm, 50*mm])
    for sub, paras in METHOD_SUBSECTIONS:
        add_sub(sub)
        for p in paras: add_para(p)
        if sub.startswith("B."):
            story.append(RLImage(str(fig1), width=80*mm, height=56*mm))
            story.append(Paragraph("Figura. 1 Arquitetura modular e fluxo local de dados do protótipo. Fonte: elaboração própria.", styles["caption"]))
        if sub.startswith("F."):
            story.append(RLImage(str(fig2), width=62*mm, height=88.6*mm))
            story.append(Paragraph("Figura. 2 Etapas do procedimento de uso e verificação funcional. Fonte: elaboração própria.", styles["caption"]))
    for heading, paras in RESULTS:
        add_main(heading)
        for i,p in enumerate(paras):
            add_para(p)
            if i == 1:
                story.append(Paragraph("Tabela 2 Evidências de verificação no estado atual", styles["tablecap"]))
                add_table(TEST_ROWS, [25*mm, 30*mm, 28*mm])
    for heading, paras in DISCUSSION:
        add_main(heading)
        for p in paras: add_para(p)
    add_main("REFERÊNCIAS")
    for ref in REFERENCES: story.append(Paragraph(escape_pdf(ref), styles["ref"]))
    doc.build(story)


def main():
    fig1 = make_architecture_figure()
    fig2 = make_flow_figure()
    make_docx(fig1, fig2)
    make_pdf(fig1, fig2)
    print(DOCX_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
