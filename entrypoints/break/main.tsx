import React from 'react';
import { createRoot } from 'react-dom/client';
import { BreakApp } from '../../components/BreakApp';
import './style.css';

const root = document.getElementById('root');

if (!root) throw new Error('Break app root was not found.');

createRoot(root).render(
  <React.StrictMode>
    <BreakApp />
  </React.StrictMode>,
);
