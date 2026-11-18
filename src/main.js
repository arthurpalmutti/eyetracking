// Ponto de entrada do protótipo "Olhar em Leitura".
//
// Importa os estilos e inicializa a aplicação, montando-a no elemento #app.
// Nenhum acesso ao WebGazer acontece aqui; todo o acesso à câmera é isolado em
// src/services/gazeTracker.js e acionado somente após consentimento explícito.

import './styles.css';
import { createApp } from './app.js';

const root = document.getElementById('app');
if (root) {
  const app = createApp(root);
  app.start();
}
