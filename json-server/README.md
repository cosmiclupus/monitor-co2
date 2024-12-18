# Monitor de Emissão de CO2 

Monitor de emissão de CO2 baseado em dados de localização GPS, que detecta automaticamente o modo de transporte e calcula as emissões de carbono.

## Pré-requisitos

- Node.js
- RabbitMQ Server
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

## Como Usar

### Para Testes (Dados Simulados)

1. Inicie o serviço Consumer:
```bash
node consumer.js
```

2. Em um novo terminal, execute o Mock Data Publisher:
```bash
node mockDataPublisher.js
```

O sistema simulará dados de movimento com diferentes velocidades para testar vários modos de transporte.

### Para Coleta de Dados Reais (Sensor Logger iOS)

1. Inicie o servidor WebSocket:
```bash
node index.js
```

2. Inicie o serviço Consumer em um novo terminal:
```bash
node consumer.js
```

3. Abra o aplicativo Sensor Logger no seu dispositivo iOS:
   * Configure a conexão WebSocket com o IP do seu servidor
   * Inicie a coleta de dados
   * Ative o registro GPS

## Endpoints

* Métricas: `http://localhost:3000/metrics`
* WebSocket: `ws://seu-ip:8080`

## Modos de Transporte

A classificação do modo de transporte é baseada na velocidade detectada:

| Modo      | Velocidade          |
|-----------|---------------------|
| Parado    | ≤ 1 km/h           |
| A pé      | > 1 e ≤ 13 km/h    |
| Ônibus    | > 13 e ≤ 30 km/h   |
| Carro     | > 30 km/h          |

## Estrutura do Projeto

```
├── consumer.js            # Serviço principal para processamento de dados de localização
├── mockDataPublisher.js   # Simulação de dados para teste
├── index.js              # Servidor WebSocket para Sensor Logger
└── README.md             # Este arquivo
```

## Monitoramento de CO2

O sistema calcula automaticamente as emissões de CO2 baseado no modo de transporte:
- Parado e A pé: 0g/km
- Ônibus: 82g/km
- Carro: 192g/km

## Desenvolvimento

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Faça commit das suas mudanças
4. Envie um pull request

## Licença

Este projeto está sob a licença MIT.


