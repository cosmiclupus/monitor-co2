import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          Monitor de Emissão de CO2
        </h1>
        <ul className="header-nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">Sobre</Link></li>
          <li><Link to="/contact">Contatos</Link></li>
        </ul>
      </div>
    </header>
  );
}

export default Header;