import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import Icon from '../components/common/Icon.jsx'
import UpgradeModal from '../components/common/UpgradeModal.jsx'
import { brandsService } from '../services/brandsService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getBrandDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

const MONITOR_TYPES = [
  { id: 'brand', label: 'Brand' },
  { id: 'company', label: 'Company / Org' },
  { id: 'product', label: 'Product / SaaS' },
  { id: 'personal_name', label: 'Personal Name' },
  { id: 'creator', label: 'Creator / Influencer' },
  { id: 'campaign', label: 'Campaign / Event' },
  { id: 'keyword', label: 'Keyword Cluster' },
]

const PLATFORM_OPTIONS = [
  { id: 'x', label: 'X (Twitter)' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
]

const PRESET_DEMO_BRANDS = [
  { name: 'OpenAI', type: 'company', primaryKeyword: 'OpenAI', alternativeKeywords: '#ChatGPT, #GPT4, @OpenAI', description: 'AI research and deployment company behind ChatGPT and GPT-4.' },
  { name: 'Nike', type: 'brand', primaryKeyword: 'Nike', alternativeKeywords: '#JustDoIt, #AirMax, @NikeSupport', description: 'Global athletic footwear, apparel, and equipment manufacturer.' },
  { name: 'Tesla', type: 'brand', primaryKeyword: 'Tesla', alternativeKeywords: '#Model3, #Cybertruck, @Tesla', description: 'Electric vehicle manufacturer and clean energy company.' },
  { name: 'Apple', type: 'product', primaryKeyword: 'iPhone', alternativeKeywords: '#Apple, #iOS, #MacBook', description: 'Global consumer electronics, software, and online services.' },
]

function BrandsPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Add/Edit Brand Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [brandForm, setBrandForm] = useState({
    name: '',
    type: 'brand',
    primaryKeyword: '',
    alternativeKeywords: '',
    platforms: ['x', 'reddit', 'linkedin'],
    description: '',
    website: '',
  })
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Pipeline Execution State
  const [runningBrandId, setRunningBrandId] = useState(null)
  const [pipelineNotice, setPipelineNotice] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const fetchBrands = () => {
    setLoading(true)
    setError(null)
    brandsService
      .getBrands()
      .then((res) => setBrands(res.data.brands || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleOpenAddModal = () => {
    setEditingBrand(null)
    setBrandForm({
      name: '',
      type: 'brand',
      primaryKeyword: '',
      alternativeKeywords: '',
      platforms: ['x', 'reddit', 'linkedin'],
      description: '',
      website: '',
    })
    setModalError(null)
    setShowAddModal(true)
  }

  const handleOpenEditModal = (brand) => {
    setEditingBrand(brand)
    setBrandForm({
      name: brand.name,
      type: brand.type || 'brand',
      primaryKeyword: brand.primaryKeyword,
      alternativeKeywords: (brand.alternativeKeywords || []).join(', '),
      platforms: brand.platforms || ['x', 'reddit', 'linkedin'],
      description: brand.description || '',
      website: brand.website || '',
    })
    setModalError(null)
    setShowAddModal(true)
  }

  const handleQuickAddPreset = (preset) => {
    setEditingBrand(null)
    setBrandForm({
      name: preset.name,
      type: preset.type,
      primaryKeyword: preset.primaryKeyword,
      alternativeKeywords: preset.alternativeKeywords,
      platforms: ['x', 'reddit', 'linkedin'],
      description: preset.description,
      website: '',
    })
    setModalError(null)
    setShowAddModal(true)
  }

  const togglePlatform = (platformId) => {
    setBrandForm((prev) => {
      const exists = prev.platforms.includes(platformId)
      const next = exists
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId]
      return { ...prev, platforms: next }
    })
  }

  const handleSaveBrand = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!brandForm.name.trim()) {
      setModalError('Brand name is required')
      return
    }
    if (!brandForm.primaryKeyword.trim()) {
      setModalError('Primary keyword is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: brandForm.name.trim(),
        type: brandForm.type,
        primaryKeyword: brandForm.primaryKeyword.trim(),
        alternativeKeywords: brandForm.alternativeKeywords
          ? brandForm.alternativeKeywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        platforms: brandForm.platforms,
        description: brandForm.description.trim(),
        website: brandForm.website.trim(),
      }

      if (editingBrand) {
        const res = await brandsService.updateBrand(editingBrand._id, payload)
        setBrands((prev) => prev.map((b) => (b._id === editingBrand._id ? res.data.brand : b)))
      } else {
        const res = await brandsService.createBrand(payload)
        setBrands((prev) => [res.data.brand, ...prev])
      }

      setShowAddModal(false)
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('plan allows')) {
        setShowAddModal(false)
        setShowUpgradeModal(true)
      } else {
        setModalError(err.response?.data?.message || err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBrand = async (brandId, brandName) => {
    if (!window.confirm(`Are you sure you want to delete monitoring for '${brandName}'?`)) return

    try {
      await brandsService.deleteBrand(brandId)
      setBrands((prev) => prev.filter((b) => b._id !== brandId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleStatus = async (brand) => {
    const nextStatus = brand.status === 'active' ? 'paused' : 'active'
    try {
      const res = await brandsService.updateBrand(brand._id, { status: nextStatus })
      setBrands((prev) => prev.map((b) => (b._id === brand._id ? res.data.brand : b)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRunPipeline = async (brandId) => {
    setRunningBrandId(brandId)
    setPipelineNotice(null)

    try {
      const res = await brandsService.runBrandPipeline(brandId)
      setPipelineNotice({
        type: 'success',
        message: res.data.message || 'Pipeline executed successfully!',
      })
      await refreshUser?.()
      fetchBrands()
    } catch (err) {
      if (
        err.response?.status === 403 &&
        (err.response?.data?.message?.includes('pipeline limit') ||
          err.response?.data?.error === 'USAGE_LIMIT_REACHED')
      ) {
        setShowUpgradeModal(true)
      } else {
        setPipelineNotice({
          type: 'error',
          message: err.response?.data?.message || err.message,
        })
      }
    } finally {
      setRunningBrandId(null)
    }
  }

  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      !searchQuery.trim() ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.primaryKeyword.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (activeFilter === 'active') return b.status === 'active'
    if (activeFilter === 'paused') return b.status === 'paused'
    if (activeFilter !== 'all') return b.type === activeFilter
    return true
  })

  const getInitials = (name) => {
    if (!name) return 'B'
    const parts = name.trim().split(/\s+/)
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <PageContainer
      title="My Brands & Monitoring Profiles"
      subtitle="Track your brands, creators, products, or keywords across social media feeds."
    >
      <div className="brands-page-container">
        {/* Header Toolbar */}
        <div className="brands-page-head">
          <div className="brands-head-left">
            <div className="brands-quota-pill">
              <Icon name="target" size={16} />
              <span>
                Tracked Profiles: <strong>{brands.length}</strong> · Plan: <strong>{user?.plan || 'Free'}</strong>
              </span>
            </div>

            {brands.length > 0 && (
              <div className="brands-search-wrapper">
                <span className="brands-search-icon">🔍</span>
                <input
                  type="text"
                  className="brands-search-input"
                  placeholder="Search brands or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <button type="button" className="btn btn--primary" onClick={handleOpenAddModal}>
            + Add New Brand Profile
          </button>
        </div>

        {/* Filter Tabs */}
        {brands.length > 0 && (
          <div className="brands-filter-tabs">
            <button
              type="button"
              className={`brand-filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({brands.length})
            </button>
            <button
              type="button"
              className={`brand-filter-chip ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active ({brands.filter((b) => b.status === 'active').length})
            </button>
            <button
              type="button"
              className={`brand-filter-chip ${activeFilter === 'paused' ? 'active' : ''}`}
              onClick={() => setActiveFilter('paused')}
            >
              Paused ({brands.filter((b) => b.status === 'paused').length})
            </button>
            {MONITOR_TYPES.map((t) => {
              const count = brands.filter((b) => b.type === t.id).length
              if (count === 0) return null
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`brand-filter-chip ${activeFilter === t.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(t.id)}
                >
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {pipelineNotice && (
          <div className={`notification-banner notification-banner--${pipelineNotice.type}`}>
            <span>{pipelineNotice.message}</span>
            <button type="button" className="banner-close" onClick={() => setPipelineNotice(null)}>
              ✕
            </button>
          </div>
        )}

        {loading && <Loading label="Loading monitoring profiles..." />}

        {!loading && error && <ErrorMessage message={error} onRetry={fetchBrands} />}

        {/* Empty State Card */}
        {!loading && !error && brands.length === 0 && (
          <div className="card empty-brand-card">
            <div className="empty-brand-icon-wrapper">
              <Icon name="target" size={36} />
            </div>
            <h3>Start Monitoring Your First Brand</h3>
            <p>
              Add your brand, product line, personal creator handle, or target keyword cluster to begin auto-discovering live mentions, sentiment analysis, and social insights.
            </p>

            <div className="empty-brand-features">
              <span className="empty-feature-tag">✨ 4-Agent Intelligence Pipeline</span>
              <span className="empty-feature-tag">📊 Live Sentiment & Vector RAG</span>
              <span className="empty-feature-tag">🌐 Multi-Platform (X, Reddit, LinkedIn)</span>
            </div>

            <button type="button" className="btn btn--primary btn--lg" onClick={handleOpenAddModal}>
              + Add Your First Brand
            </button>

            {/* Quick Setup Presets */}
            <div className="quick-presets-section">
              <div className="quick-presets-title">Or test with 1-click popular presets:</div>
              <div className="quick-presets-grid">
                {PRESET_DEMO_BRANDS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="preset-btn"
                    onClick={() => handleQuickAddPreset(preset)}
                  >
                    <span className="preset-btn-name">{preset.name}</span>
                    <span className="preset-btn-type">{preset.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Brands Grid */}
        {!loading && !error && brands.length > 0 && (
          <>
            {filteredBrands.length === 0 ? (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                <p>No brand profiles matched your search filter "{searchQuery}".</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => { setSearchQuery(''); setActiveFilter('all') }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="brands-grid">
                {filteredBrands.map((brand) => {
                  const isRunning = runningBrandId === brand._id
                  const stats = brand.stats || {}

                  return (
                    <article className="brand-card" key={brand._id}>
                      <div className="brand-card__head">
                        <div className="brand-avatar-name">
                          <div className="brand-avatar-circle">{getInitials(brand.name)}</div>
                          <div>
                            <span className="brand-type-badge">{brand.type?.replace('_', ' ').toUpperCase()}</span>
                            <h3 className="brand-name">
                              <Link to={getBrandDetailPath(brand._id)}>{brand.name}</Link>
                            </h3>
                          </div>
                        </div>
                        <span className={`status-pill status-pill--${brand.status}`}>
                          {brand.status}
                        </span>
                      </div>

                      <div className="brand-keywords-row">
                        <span className="keyword-primary">🔑 {brand.primaryKeyword}</span>
                        {(brand.alternativeKeywords || []).slice(0, 3).map((kw, i) => (
                          <span key={i} className="keyword-alt">#{kw}</span>
                        ))}
                      </div>

                      {brand.description && <p className="brand-description">{brand.description}</p>}

                      {/* Live Stats Row */}
                      <div className="brand-stats-row">
                        <div className="stat-box">
                          <span className="stat-label">Mentions</span>
                          <strong className="stat-val">{stats.totalMentions || 0}</strong>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Sentiment</span>
                          <strong className={`stat-val ${stats.averageSentiment >= 0 ? 'text-pos' : 'text-neg'}`}>
                            {stats.averageSentiment !== undefined
                              ? stats.averageSentiment > 0
                                ? `+${stats.averageSentiment}`
                                : stats.averageSentiment
                              : '0.00'}
                          </strong>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Runs</span>
                          <strong className="stat-val">{stats.pipelineRunsCount || 0}</strong>
                        </div>
                      </div>

                      {/* Platforms & Last Analyzed */}
                      <div className="brand-meta-row">
                        <div className="brand-platforms-chips">
                          {(brand.platforms || []).map((p) => (
                            <span key={p} className="platform-tiny-chip">
                              {p}
                            </span>
                          ))}
                        </div>
                        <span className="brand-last-run">
                          {brand.lastAnalyzedAt ? `Last run: ${formatDate(brand.lastAnalyzedAt)}` : 'Not analyzed yet'}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="brand-card__footer">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm run-brand-btn"
                          onClick={() => handleRunPipeline(brand._id)}
                          disabled={isRunning || brand.status === 'paused'}
                          title="Run 4-Agent Intelligence Pipeline for this brand"
                        >
                          {isRunning ? '⚡ Executing Agents...' : '⚡ Run Analysis Pipeline'}
                        </button>

                        <div className="brand-card__footer-secondary">
                          <Link to={getBrandDetailPath(brand._id)} className="btn btn--outline btn--sm">
                            View Details
                          </Link>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleOpenEditModal(brand)}
                            title="Edit profile settings"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleToggleStatus(brand)}
                            title={brand.status === 'active' ? 'Pause monitoring' : 'Resume monitoring'}
                          >
                            {brand.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger-text"
                            onClick={() => handleDeleteBrand(brand._id, brand.name)}
                            title="Delete profile"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Add / Edit Brand Modal */}
        {showAddModal && (
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="modal brand-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal__head">
                <div className="modal__head-title-group">
                  <div className="modal__head-icon">🎯</div>
                  <h2>{editingBrand ? 'Edit Monitoring Profile' : 'Add Brand Profile'}</h2>
                </div>
                <button type="button" className="modal__close" onClick={() => setShowAddModal(false)} aria-label="Close modal">
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="error-message" style={{ margin: '16px 24px 0' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveBrand} className="brand-modal-form">
                <div className="form-group">
                  <label className="form__label">Profile Type *</label>
                  <select
                    className="form__input"
                    value={brandForm.type}
                    onChange={(e) => setBrandForm({ ...brandForm, type: e.target.value })}
                  >
                    {MONITOR_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form__label">Brand / Entity Name *</label>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="e.g. Nike, Apple, Acme Corp, or @JohnDoe"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form__label">Primary Search Keyword *</label>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="e.g. Nike, iPhone, Acme software"
                    value={brandForm.primaryKeyword}
                    onChange={(e) => setBrandForm({ ...brandForm, primaryKeyword: e.target.value })}
                    required
                  />
                  <span className="form-hint">Main term to query across platform social feeds</span>
                </div>

                <div className="form-group">
                  <label className="form__label">Alternative Keywords & Hashtags</label>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="e.g. #JustDoIt, NikeShoes, AirMax, @NikeSupport"
                    value={brandForm.alternativeKeywords}
                    onChange={(e) => setBrandForm({ ...brandForm, alternativeKeywords: e.target.value })}
                  />
                  <span className="form-hint">Comma-separated hashtags or alternate names</span>
                </div>

                <div className="form-group">
                  <label className="form__label">Target Platforms to Monitor</label>
                  <div className="platform-selector-grid">
                    {PLATFORM_OPTIONS.map((p) => {
                      const isSelected = brandForm.platforms.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`platform-toggle-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => togglePlatform(p.id)}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form__label">Description (Optional)</label>
                  <textarea
                    className="form__input"
                    rows="2"
                    placeholder="Brief context about this monitored brand..."
                    value={brandForm.description}
                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  />
                </div>

                <div className="modal__actions">
                  <button type="button" className="btn btn--outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? 'Saving...' : editingBrand ? 'Update Profile' : 'Create & Monitor ➔'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quota Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentUsage={user?.pipelineUsage}
          userPlan={user?.plan}
        />
      </div>
    </PageContainer>
  )
}

export default BrandsPage
