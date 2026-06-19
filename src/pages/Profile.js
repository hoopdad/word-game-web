import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useCustomHooks';
import apiClient from '@/services/apiClient';
import './Profile.css';
const DISPLAY_NAME_REGEX = /^[A-Za-z0-9 ]{2,20}$/;
const isDisplayNameValid = (name) => DISPLAY_NAME_REGEX.test(name);
export const Profile = () => {
    const navigate = useNavigate();
    const { setTokenInApi } = useAuth();
    const [originalDisplayName] = useState(() => localStorage.getItem('displayName') ?? '');
    const [displayName, setDisplayName] = useState(originalDisplayName);
    const [isAvailable, setIsAvailable] = useState(originalDisplayName ? true : null);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [tokenReady, setTokenReady] = useState(false);
    const debouncedName = useDebounce(displayName, 300);
    useEffect(() => {
        const initToken = async () => {
            try {
                await setTokenInApi();
                setTokenReady(true);
            }
            catch {
                setError('Failed to initialize authentication');
            }
        };
        void initToken();
    }, [setTokenInApi]);
    useEffect(() => {
        if (!tokenReady)
            return;
        if (debouncedName === originalDisplayName && originalDisplayName) {
            setIsAvailable(true);
            setError(null);
            setChecking(false);
            return;
        }
        if (!isDisplayNameValid(debouncedName)) {
            setIsAvailable(null);
            setChecking(false);
            return;
        }
        const checkNameAvailability = async () => {
            setChecking(true);
            try {
                const available = await apiClient.checkNameAvailability(debouncedName);
                setIsAvailable(available);
                setError(null);
            }
            catch {
                setError('Failed to check name availability');
                setIsAvailable(null);
            }
            finally {
                setChecking(false);
            }
        };
        void checkNameAvailability();
    }, [debouncedName, tokenReady, originalDisplayName]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isDisplayNameValid(displayName) || !isAvailable) {
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await apiClient.updateProfile(displayName);
            localStorage.setItem('displayName', displayName);
            navigate('/dashboard');
        }
        catch (err) {
            const error = err;
            if (error.response?.status === 409) {
                setError('that name is taken');
            }
            else {
                setError('Failed to update profile. Please try again.');
            }
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "profile-container", children: _jsxs("div", { className: "profile-card", children: [_jsx("h1", { children: "Your Profile" }), _jsxs("p", { children: ["Current display name: ", _jsx("strong", { children: originalDisplayName })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "displayName", children: "Display Name" }), _jsx("input", { id: "displayName", type: "text", value: displayName, onChange: (e) => {
                                        setDisplayName(e.target.value);
                                        setError(null);
                                    }, placeholder: "2-20 characters", maxLength: 20, minLength: 2, disabled: saving || !tokenReady, "aria-describedby": isAvailable === false ? 'profile-name-error' : undefined }), checking && _jsx("span", { className: "loading", children: "Checking..." }), isAvailable === true && _jsx("span", { className: "available", children: "\u2713 Available" }), isAvailable === false && (_jsx("span", { className: "unavailable", id: "profile-name-error", children: "\u2717 That name is taken" }))] }), error && _jsx("div", { className: "error-message", children: error }), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { type: "button", onClick: () => navigate('/dashboard'), disabled: saving, className: "secondary-button", children: "Cancel" }), _jsx("button", { type: "submit", disabled: !tokenReady || saving || !isDisplayNameValid(displayName) || !isAvailable, className: "submit-button", children: saving ? 'Saving...' : 'Save Profile' })] })] })] }) }));
};
