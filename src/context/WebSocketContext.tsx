import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'

/// <reference types="node" />

export interface WebSocketMessage {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  guess?: string
  user?: string
  ticket?: string
}

interface WebSocketContextType {
  connected: boolean
  send: (message: WebSocketMessage) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (type: string, callback: (data: any) => void) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: (type: string, callback: (data: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider = ({
  children,
  wsUrl,
  onConnected,
}: {
  children: ReactNode
  wsUrl: string
  onConnected: () => Promise<string>
}) => {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const listenersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map())
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const emit = useCallback((type: string, data?: unknown) => {
    const listeners = listenersRef.current.get(type)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      const ticket = await onConnected()
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', ticket }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as Record<string, unknown>
          const { type, ...payload } = message
          if (typeof type !== 'string') {
            console.error('WebSocket message missing type:', message)
            return
          }
          emit(type, payload)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        setConnected(false)
        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          connect()
        }, delay)
      }

      wsRef.current = ws
      setConnected(true)
      reconnectAttemptsRef.current = 0
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++
        connect()
      }, delay)
    }
  }, [wsUrl, onConnected, emit])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const on = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (type: string, callback: (data: any) => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set())
      }
      listenersRef.current.get(type)!.add(callback)

      return () => {
        const listeners = listenersRef.current.get(type)
        if (listeners) {
          listeners.delete(callback)
        }
      }
    },
    [],
  )

  const off = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (type: string, callback: (data: any) => void) => {
      const listeners = listenersRef.current.get(type)
      if (listeners) {
        listeners.delete(callback)
      }
    },
    [],
  )

  return (
    <WebSocketContext.Provider value={{ connected, send, on, off }}>
      {children}
    </WebSocketContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
