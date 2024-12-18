import React from 'react';
import './TransportInfo.css';

const modeTranslations = {
  'rest': 'Parado',
  'byFoot': 'A pé',
  'bus': 'Ônibus',
  'car': 'Carro'
};

const transportIcons = {
  rest: '🧍',
  byFoot: '🚶',
  bus: '🚌',
  car: '🚗'
};

function TransportInfo({ mode, speed }) {
  const formattedSpeed = typeof speed === 'number' ? speed.toFixed(2) : '0.00';
  const translatedMode = modeTranslations[mode] || 'Desconhecido';
  const icon = transportIcons[mode] || '❓';
  
  return (
    <div className="transport-info">
      <div className="transport-mode">
        <span>Meio de transporte: </span>
        <span className="transport-icon">{icon}</span>
        <span className="transport-text">{translatedMode}</span>
      </div>
      <div className="transport-speed">
        <span>Velocidade: {formattedSpeed} km/h</span>
      </div>
    </div>
  );
}

export default TransportInfo;