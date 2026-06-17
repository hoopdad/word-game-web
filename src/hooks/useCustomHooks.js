import { useState, useCallback, useEffect } from 'react';
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};
export const useAsync = (asyncFunction, immediate = true) => {
    const [status, setStatus] = useState('idle');
    const [value, setValue] = useState(null);
    const [error, setError] = useState(null);
    const execute = useCallback(async () => {
        setStatus('pending');
        setValue(null);
        setError(null);
        try {
            const response = await asyncFunction();
            setValue(response);
            setStatus('success');
            return response;
        }
        catch (error) {
            setError(error);
            setStatus('error');
        }
    }, [asyncFunction]);
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);
    return { execute, status, value, error };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            console.log(error);
            return initialValue;
        }
    });
    const setValue = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        }
        catch (error) {
            console.log(error);
        }
    }, [key, storedValue]);
    return [storedValue, setValue];
};
