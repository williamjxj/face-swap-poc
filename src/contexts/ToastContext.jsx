'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast component
const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-green-500'
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 mb-3 bg-[#1a1d24] border-l-4 ${getBorderColor()} 
        rounded-r-lg shadow-lg backdrop-blur-sm border border-gray-700
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-sm font-medium text-white mb-1">{toast.title}</h4>}
        <p className="text-sm text-gray-300">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast container
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', title = null, duration = 5000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, title, duration }

    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const toast = {
    success: (message, title = null, duration = 5000) =>
      addToast(message, 'success', title, duration),
    error: (message, title = null, duration = 7000) => addToast(message, 'error', title, duration),
    warning: (message, title = null, duration = 6000) =>
      addToast(message, 'warning', title, duration),
    info: (message, title = null, duration = 5000) => addToast(message, 'info', title, duration),
    custom: addToast,
    remove: removeToast,
    removeAll: removeAllToasts,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}
