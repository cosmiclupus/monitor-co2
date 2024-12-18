import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './CO2Chart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function CO2Chart({ data }) {
  const maxCO2 = useMemo(() => Math.max(...data.map(d => d.totalCO2)), [data]);

  const getYAxisConfig = (maxValue) => {
    if (maxValue <= 100) return { max: 100, stepSize: 20 };
    if (maxValue <= 500) return { max: 500, stepSize: 100 };
    if (maxValue <= 1000) return { max: 1000, stepSize: 200 };
    return { max: Math.ceil(maxValue / 1000) * 1000, stepSize: 500 };
  };

  const { max, stepSize } = getYAxisConfig(maxCO2);

  const chartData = {
    labels: data.map((_, index) => index * 5),
    datasets: [
      {
        label: 'Emissões totais de CO2',
        data: data.map(d => d.totalCO2),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 15,
          padding: 8,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Emissões de CO2 x Tempo',
        font: { size: 16, weight: 'bold' },
        padding: { top: 20, bottom: 10 }  // Aumentado o padding superior do título
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: max,
        ticks: {
          stepSize: stepSize,
          font: { size: 11 }
        },
        title: {
          display: true,
          text: 'Emissões CO2 (g)',
          font: { size: 12, weight: 'bold' }
        },
      },
      x: {
        title: {
          display: true,
          text: 'Tempo (segundos)',
          font: { size: 12, weight: 'bold' }
        },
        ticks: {
          font: { size: 11 }
        },
      },
    },
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 25,  // Aumentado o padding superior do layout
        bottom: 5
      }
    }
  };

  return (
    <div className="chart-container">
      <Line options={options} data={chartData} />
    </div>
  );
}

export default CO2Chart;