import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')
console.log('main.jsx: rootElement:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
  const newRoot = document.createElement('div')
  newRoot.id = 'root'
  document.body.appendChild(newRoot)
  console.log('Created new root element')
}

try {
  createRoot(rootElement).render(<App />)
  console.log('React app rendered successfully')
} catch (error) {
  console.error('Failed to render React app:', error)
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; color: #dc2626; font-family: system-ui;">
      <h1>Failed to render app</h1>
      <pre style="text-align: left; max-width: 600px; margin: 20px auto; padding: 20px; background: #fef2f2; border-radius: 8px; overflow: auto; color: #dc2626; font-size: 14px;">
        ${error.stack || error.message}
      </pre>
    </div>
  `
}
