import React from 'react';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <h1 className="layout-title">CO2 Emission Monitor</h1>
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;