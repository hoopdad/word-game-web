import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/services/apiClient'
import './CategoryConfig.css'

interface CategoryUrl {
  id: string
  url: string
}

export const CategoryConfig = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryUrl[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const config = await apiClient.getCategoryConfig()
        setCategories(config.urls || [])
      } catch (err) {
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!isValidUrl(newUrl)) {
      setError('Invalid URL format')
      return
    }

    if (categories.some((c) => c.url === newUrl)) {
      setError('This URL is already added')
      return
    }

    setCategories([...categories, { id: Date.now().toString(), url: newUrl }])
    setNewUrl('')
    setError(null)
  }

  const handleRemoveUrl = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.updateCategoryConfig({ urls: categories.map((c) => c.url) })
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to save categories')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="category-config-container">
      <div className="category-config-card">
        <h1>Configure Categories</h1>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading categories...</div>
        ) : (
          <>
            <div className="add-url-section">
              <label htmlFor="newUrl">Add Category URL:</label>
              <div className="input-group">
                <input
                  id="newUrl"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/category"
                  disabled={saving}
                />
                <button onClick={handleAddUrl} disabled={saving} className="add-button">
                  Add
                </button>
              </div>
            </div>

            <div className="categories-list">
              <h2>Current Categories</h2>
              {categories.length > 0 ? (
                <ul>
                  {categories.map((category) => (
                    <li key={category.id} className="category-item">
                      <span className="url-text">{category.url}</span>
                      <button
                        onClick={() => handleRemoveUrl(category.id)}
                        disabled={saving}
                        className="remove-button"
                        aria-label={`Remove ${category.url}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-categories">No categories configured yet</p>
              )}
            </div>

            <div className="action-buttons">
              <button
                onClick={() => navigate('/dashboard')}
                disabled={saving}
                className="secondary-button"
              >
                Back to Dashboard
              </button>
              <button onClick={handleSave} disabled={saving} className="primary-button">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
