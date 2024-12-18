import { useEffect, useState, useRef } from 'react';
import { interval } from 'rxjs';
import { switchMap, retry, takeUntil } from 'rxjs/operators';
import axios from 'axios';

function DataFetcher({ onDataReceived }) {
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const repeatedCount = useRef(0);
  const MAX_REPEATED = 3; // Número máximo de timestamps repetidos antes de parar

  useEffect(() => {
    // Usar Subject para controlar o encerramento do observable
    const subscription = interval(5000)
      .pipe(
        switchMap(async () => {
          // Se já detectamos muitas repetições, não fazer a requisição
          if (repeatedCount.current >= MAX_REPEATED) {
            console.log('Stopping requests due to repeated timestamps');
            subscription.unsubscribe();
            return null;
          }

          try {
            const response = await axios.get('http://localhost:3000/metrics');
            const { timestamp } = response.data;

            if (lastTimestamp && timestamp === lastTimestamp) {
              repeatedCount.current += 1;
              console.log(`Same timestamp detected (${repeatedCount.current}/${MAX_REPEATED})`);
            } else {
              repeatedCount.current = 0; // Reseta o contador se receber timestamp diferente
            }

            return response;
          } catch (error) {
            console.error('Error fetching data:', error);
            return null;
          }
        }),
        retry({
          delay: 1000,
          count: 3
        })
      )
      .subscribe({
        next: (response) => {
          if (!response) return;

          const { currentMode, currentSpeed, timestamp, accumulated } = response.data;
          
          if (!lastTimestamp || timestamp !== lastTimestamp) {
            setLastTimestamp(timestamp);
            onDataReceived({
              currentMode,
              currentSpeed,
              timestamp: new Date(timestamp * 1000).toLocaleTimeString(),
              totalCO2: accumulated?.totalCO2
            });
          }
        },
        error: (error) => {
          console.error('Error in subscription:', error);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [onDataReceived, lastTimestamp]);

  return null;
}

export default DataFetcher;