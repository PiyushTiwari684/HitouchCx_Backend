
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FullscreenProvider } from './context/FullscreenContext'
import { ProctorProvider } from './context/ProctorContext'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <FullscreenProvider>
                <ProctorProvider>
                    <App />
                </ProctorProvider>
            </FullscreenProvider>
        </AuthProvider>
    </BrowserRouter>
)
