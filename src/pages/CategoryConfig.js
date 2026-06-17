import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import './CategoryConfig.css';
export const CategoryConfig = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const config = await apiClient.getCategoryConfig();
                setCategories(config.urls || []);
            }
            catch (err) {
                setError('Failed to load categories');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    };
    const handleAddUrl = () => {
        if (!newUrl.trim()) {
            setError('Please enter a URL');
            return;
        }
        if (!isValidUrl(newUrl)) {
            setError('Invalid URL format');
            return;
        }
        if (categories.some((c) => c.url === newUrl)) {
            setError('This URL is already added');
            return;
        }
        setCategories([...categories, { id: Date.now().toString(), url: newUrl }]);
        setNewUrl('');
        setError(null);
    };
    const handleRemoveUrl = (id) => {
        setCategories(categories.filter((c) => c.id !== id));
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.updateCategoryConfig({ urls: categories.map((c) => c.url) });
            navigate('/dashboard');
        }
        catch (err) {
            setError('Failed to save categories');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "category-config-container", children: _jsxs("div", { className: "category-config-card", children: [_jsx("h1", { children: "Configure Categories" }), error && _jsx("div", { className: "error-message", children: error }), loading ? (_jsx("div", { className: "loading", children: "Loading categories..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "add-url-section", children: [_jsx("label", { htmlFor: "newUrl", children: "Add Category URL:" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { id: "newUrl", type: "url", value: newUrl, onChange: (e) => setNewUrl(e.target.value), placeholder: "https://example.com/category", disabled: saving }), _jsx("button", { onClick: handleAddUrl, disabled: saving, className: "add-button", children: "Add" })] })] }), _jsxs("div", { className: "categories-list", children: [_jsx("h2", { children: "Current Categories" }), categories.length > 0 ? (_jsx("ul", { children: categories.map((category) => (_jsxs("li", { className: "category-item", children: [_jsx("span", { className: "url-text", children: category.url }), _jsx("button", { onClick: () => handleRemoveUrl(category.id), disabled: saving, className: "remove-button", "aria-label": `Remove ${category.url}`, children: "\u2715" })] }, category.id))) })) : (_jsx("p", { className: "no-categories", children: "No categories configured yet" }))] }), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { onClick: () => navigate('/dashboard'), disabled: saving, className: "secondary-button", children: "Back to Dashboard" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "primary-button", children: saving ? 'Saving...' : 'Save Changes' })] })] }))] }) }));
};
