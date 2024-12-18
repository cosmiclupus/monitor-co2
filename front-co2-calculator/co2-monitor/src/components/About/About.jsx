import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about">
      <h2>Sobre o Monitor de Emissões de CO2</h2>
      <p>Este projeto foi desenvolvido para rastrear e visualizar as emissões de CO2 baseadas em diferentes modos de transporte. Veja o que ele faz:</p>
      <ul>
        <li>Coleta dados de localização e velocidade dos usuários em tempo real</li>
        <li>Analisa padrões de movimento para determinar o modo de transporte (repouso, caminhada, ônibus, carro)</li>
        <li>Calcula as emissões de CO2 para cada jornada com base no modo de transporte</li>
        <li>Fornece um gráfico em tempo real das emissões cumulativas de CO2 ao longo do tempo</li>
        <li>Oferece insights sobre a pegada de carbono pessoal relacionada ao deslocamento diário</li>
        <li>Ajuda os usuários a tomar decisões informadas sobre suas escolhas de transporte</li>
        <li>Contribui para aumentar a conscientização sobre o impacto ambiental de diferentes modos de transporte</li>
      </ul>
      <p>Ao usar esta ferramenta, os indivíduos podem entender melhor e potencialmente reduzir sua pegada de carbono.</p>
    </div>
  );
}

export default About;