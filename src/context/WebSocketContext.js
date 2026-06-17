import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
const WebSocketContext = createContext(undefined);
export const WebSocketProvider = ({ children, wsUrl, onConnected, }) => {
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const listenersRef = useRef(new Map());
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const emit = useCallback((type, data) => {
        const listeners = listenersRef.current.get(type);
        if (listeners) {
            listeners.forEach((callback) => callback(data));
        }
    }, []);
    const connect = useCallback(async () => {
        try {
            const ticket = await onConnected();
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'auth', ticket }));
            };
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    emit(message.type, message.data);
                }
                catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            ws.onclose = () => {
                setConnected(false);
                // Exponential backoff reconnect
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttemptsRef.current++;
                    connect();
                }, delay);
            };
            wsRef.current = ws;
            setConnected(true);
            reconnectAttemptsRef.current = 0;
        }
        catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++;
                connect();
            }, delay);
        }
    }, [wsUrl, onConnected, emit]);
    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);
    const send = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
        else {
            console.warn('WebSocket is not connected');
        }
    }, []);
    const on = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (type, callback) => {
        if (!listenersRef.current.has(type)) {
            listenersRef.current.set(type, new Set());
        }
        listenersRef.current.get(type).add(callback);
        return () => {
            const listeners = listenersRef.current.get(type);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }, []);
    const off = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (type, callback) => {
        const listeners = listenersRef.current.get(type);
        if (listeners) {
            listeners.delete(callback);
        }
    }, []);
    return (_jsx(WebSocketContext.Provider, { value: { connected, send, on, off }, children: children }));
};
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
