import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useCustomHooks';
import apiClient from '@/services/apiClient';
import './NameEntry.css';
export const NameEntry = () => {
    const navigate = useNavigate();
    const { account, setTokenInApi } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isAvailable, setIsAvailable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tokenReady, setTokenReady] = useState(false);
    const debouncedName = useDebounce(displayName, 300);
    // Initialize token on mount
    useEffect(() => {
        const initToken = async () => {
            try {
                await setTokenInApi();
                setTokenReady(true);
            }
            catch (err) {
                setError('Failed to initialize authentication');
            }
        };
        initToken();
    }, [setTokenInApi]);
    useEffect(() => {
        // Only check name availability after token is ready
        if (!tokenReady)
            return;
        if (debouncedName.length >= 2 && debouncedName.length <= 20) {
            checkNameAvailability(debouncedName);
        }
        else if (debouncedName.length < 2) {
            setIsAvailable(null);
        }
    }, [debouncedName, tokenReady]);
    const checkNameAvailability = async (name) => {
        setLoading(true);
        try {
            const available = await apiClient.checkNameAvailability(name);
            setIsAvailable(available);
            setError(null);
        }
        catch (err) {
            setError('Failed to check name availability');
            setIsAvailable(null);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAvailable || displayName.length < 2 || displayName.length > 20) {
            return;
        }
        try {
            setLoading(true);
            await apiClient.registerUser(displayName);
            localStorage.setItem('displayName', displayName);
            navigate('/dashboard');
        }
        catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err;
            if (error.response?.status === 409) {
                setError('That name is taken');
            }
            else {
                setError('Failed to register. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "name-entry-container", children: _jsxs("div", { className: "name-entry-card", children: [_jsx("h1", { children: "Choose Your Display Name" }), _jsxs("p", { children: ["Welcome ", account?.name, "! Please choose how you'd like to appear in the game."] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "displayName", children: "Display Name" }), _jsx("input", { id: "displayName", type: "text", value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: "2-20 characters", maxLength: 20, minLength: 2, disabled: loading || !tokenReady, "aria-describedby": isAvailable === false ? 'name-error' : undefined }), loading && _jsx("span", { className: "loading", children: "Checking..." }), isAvailable === true && _jsx("span", { className: "available", children: "\u2713 Available" }), isAvailable === false && (_jsx("span", { className: "unavailable", id: "name-error", children: "\u2717 That name is taken" }))] }), error && _jsx("div", { className: "error-message", children: error }), _jsx("button", { type: "submit", disabled: !isAvailable || loading || displayName.length < 2, className: "submit-button", children: loading ? 'Setting up...' : 'Continue' })] })] }) }));
};
