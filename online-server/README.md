# CURRENT — servidor multiplayer online

Este servidor WebSocket permite salas privadas com 2 a 4 jogadores.

## Como hospedar

1. Crie um serviço **Web Service** Node.js em um provedor que suporte WebSockets (por exemplo, Render ou Railway), conectando este repositório.
2. Defina **Root Directory** como `online-server`.
3. Comando de instalação: `npm install`. Comando de inicialização: `npm start`.
4. O servidor escuta a porta definida pela variável `PORT` do provedor (padrão local: 8080).
5. Depois da publicação, use o endereço seguro `wss://SEU-DOMINIO` na página `online.html`. O GitHub Pages serve o jogo, mas não hospeda este servidor Node.js.

## Teste

- Abra `online.html` em dois dispositivos.
- Informe o mesmo endereço WebSocket nos dois.
- No primeiro, escolha nome/embarcação e clique **Criar sala**.
- No segundo, digite o código e clique **Entrar**.
- O criador inicia a partida. O jogo original abre com oponentes remotos.

## Limitações desta versão

Versão inicial de teste: sincroniza posições, fase e pontuação exibida. A física, os obstáculos, os rivais IA e a progressão continuam sendo calculados em cada cliente. Ainda não há validação autoritativa de resultados, persistência de salas, reconexão automática, sincronização de empurrões entre jogadores nem proteção completa contra trapaças. Para torneios competitivos, essas funcionalidades devem ser implementadas no servidor.

Use sempre `wss://` na página HTTPS do GitHub Pages. Não inclua segredos de hospedagem no repositório.
