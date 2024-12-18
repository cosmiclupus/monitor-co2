import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import CO2Chart from './components/CO2Chart/CO2Chart';
import DataFetcher from './components/DataFetcher/DataFetcher';
import TransportInfo from './components/TransportInfo/TransportInfo';
import Contact from './components/Contact/Contact';
import About from './components/About/About';
import './App.css';

function MainContent({ data, totalCO2, currentTransport }) {
  return (
    <div className="content-container flex flex-col flex-grow w-full">
      <div className="chart-container mb-8">
        <CO2Chart data={data} totalCO2={totalCO2} />
      </div>
      
      {/* Transport Info Container */}
      <div className="transport-container rounded-lg p-6 mb-6">
        <TransportInfo
          mode={currentTransport.mode}
          speed={currentTransport.speed}
        />
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState([]);
  const [currentTransport, setCurrentTransport] = useState({ mode: 'rest', speed: 0 });
  const [totalCO2, setTotalCO2] = useState(0);

  const handleDataReceived = useCallback((newDataPoint) => {
    if (newDataPoint && 
        typeof newDataPoint.currentMode === 'string' && 
        typeof newDataPoint.currentSpeed === 'number' && 
        typeof newDataPoint.totalCO2 === 'number') {
      setData((prevData) => [...prevData, newDataPoint].slice(-20));
      setCurrentTransport({
        mode: newDataPoint.currentMode,
        speed: newDataPoint.currentSpeed
      });
      setTotalCO2(newDataPoint.totalCO2);
    } else {
      console.error('Invalid data received:', newDataPoint);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTransport({ mode: 'rest', speed: 0 });
      setTotalCO2(0);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="app">
        <Header />
        <div className="main-content flex-grow flex flex-col">
          <DataFetcher onDataReceived={handleDataReceived} />
          <Routes>
            <Route 
              path="/" 
              element={
                <MainContent 
                  data={data}
                  totalCO2={totalCO2}
                  currentTransport={currentTransport}
                />
              } 
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;