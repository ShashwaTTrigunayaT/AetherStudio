import React from 'react'
import ReactDOM from 'react-dom/client'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import App from './App'
import './index.css'

// Configure Monaco workers for Vite
self.MonacoEnvironment = {
  getWorker(_, label) {
    let workerUrl

    switch (label) {
      case 'json':
        workerUrl = new URL(
          'monaco-editor/esm/vs/language/json/json.worker.js',
          import.meta.url
        )
        break
      case 'css':
      case 'scss':
      case 'less':
        workerUrl = new URL(
          'monaco-editor/esm/vs/language/css/css.worker.js',
          import.meta.url
        )
        break
      case 'html':
      case 'handlebars':
      case 'razor':
        workerUrl = new URL(
          'monaco-editor/esm/vs/language/html/html.worker.js',
          import.meta.url
        )
        break
      case 'typescript':
      case 'javascript':
        workerUrl = new URL(
          'monaco-editor/esm/vs/language/typescript/ts.worker.js',
          import.meta.url
        )
        break
      default:
        workerUrl = new URL(
          'monaco-editor/esm/vs/editor/editor.worker.js',
          import.meta.url
        )
    }

    return new Worker(workerUrl, { type: 'module' })
  },
}

// Use the locally installed monaco-editor instead of loading from CDN
loader.config({ monaco })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)