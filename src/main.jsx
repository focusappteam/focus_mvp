import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				{/*
					OnboardingProvider vive aquí — fuera de BoardProvider/TimerProvider
					para no depender de ellos, pero dentro de AuthProvider por si
					en el futuro se necesita leer el userId.
				*/}
					<App />
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>
);