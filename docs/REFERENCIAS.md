# Referências — Olhar em Leitura

Referências bibliográficas e técnicas que fundamentam o protótipo. Ao resumir os
estudos, evita-se **atribuir ao WebGazer resultados obtidos com outras
plataformas**: cada trabalho diz respeito ao sistema que efetivamente avaliou.

---

## Referências acadêmicas

1. **Hutt, S.; Wong, A.; Papoutsaki, A.; Baker, R. S.; Gold, J. I.; Mills, C.
   (2024).** *Webcam-based eye tracking to detect mind wandering and
   comprehension errors.* Behavior Research Methods, 56, 1–17.
   DOI: [https://doi.org/10.3758/s13428-022-02040-x](https://doi.org/10.3758/s13428-022-02040-x)

2. **Serrano-Carot, M.; Angele, B.; Xu, H. et al. (2026).** *Webcams can be used
   to study eye movements during reading.* Behavior Research Methods, 58, artigo
   331.
   DOI: [https://doi.org/10.3758/s13428-026-03199-3](https://doi.org/10.3758/s13428-026-03199-3)

3. **Kaduk, K. et al. (2024; online 2023).** *Webcam eye tracking close to
   laboratory standards: Comparing a new webcam-based system and the EyeLink
   1000.* Behavior Research Methods, 56, 5002–5022.
   DOI: [https://doi.org/10.3758/s13428-023-02141-7](https://doi.org/10.3758/s13428-023-02141-7)

4. **Papoutsaki, A. et al. (2016).** *WebGazer: Scalable Webcam Eye Tracking
   Using User Interactions.* Proceedings of the 25th International Joint
   Conference on Artificial Intelligence (IJCAI 2016).

---

## Referências técnicas

5. **WebGazer.js — repositório oficial:**
   [https://github.com/brownhci/webgazer](https://github.com/brownhci/webgazer)

6. **WebGazer.js — Top Level API (wiki):**
   [https://github.com/brownhci/WebGazer/wiki/Top-Level-API](https://github.com/brownhci/WebGazer/wiki/Top-Level-API)

7. **MDN — `MediaDevices.getUserMedia()`:**
   [https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

8. **Vite — Getting Started:**
   [https://vite.dev/guide/](https://vite.dev/guide/)

---

## Nota sobre o uso das referências neste protótipo

O estudo de **Serrano-Carot et al. (2026)** indica que webcams **podem** ser
usadas para estudar movimentos oculares durante a leitura, mas também relata
**ruído e limitações** relevantes dessa abordagem. Essa constatação **justifica
diretamente** as decisões de projeto do protótipo: em vez de tentar rastreamento
em nível de palavra ou inferências finas, o sistema se restringe à
**classificação ampla da área de leitura** (dentro/fora) e à detecção de
**episódios sustentados** de afastamento e retorno, que são mais robustos ao
ruído inerente ao rastreamento por webcam.

Da mesma forma, resultados de precisão próximos a padrões de laboratório
relatados por **Kaduk et al. (2024)** referem-se ao **sistema específico** que
aquele estudo avaliou, e **não** devem ser generalizados para o WebGazer ou para
este protótipo. O protótipo deste TCC não reivindica tal precisão.
