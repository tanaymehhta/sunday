import React from 'react';

const Header: React.FC = () => {
  const formatDate = (): string => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="header">
      <div className="date-row">
        <span>📅</span>
        <span>{formatDate()}</span>
      </div>
      <h1 className="title">Record</h1>
      <p className="subtitle">Capture your activities with voice notes</p>
    </header>
  );
};

export default Header;
