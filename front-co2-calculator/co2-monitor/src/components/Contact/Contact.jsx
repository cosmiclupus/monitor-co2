import React from 'react';
import './Contact.css';

const Contact = () => {
  const contacts = [
    {
      nome: 'Yatherson Lucas T. Souza',
      matricula: '201912485',
      email: 'yathersonlucas@discente.ufg.br'
    },
    {
      nome: 'Valquimar Silva dos Santos',
      matricula: '202108415',
      email: 'santos2345@discente.ufg.br'
    }
  ];

  return (
    <div className="contact-container">
      <h2 className="contact-title">Contacts</h2>
      <div className="contact-items">
        {contacts.map((contact, index) => (
          <div key={index} className="contact-item">
            <div className="contact-name">Nome: {contact.nome}</div>
            <div className="contact-info">Matrícula: {contact.matricula}</div>
            <div className="contact-info">E-mail: {contact.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contact;