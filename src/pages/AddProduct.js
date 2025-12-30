import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Basic product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [brandName, setBrandName] = useState('');

  // Toggle states
  const [showDiscount, setShowDiscount] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [images, setImages] = useState([]);

  // Options data
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categorySearch, setCategorySearch] = useState('');
  const [audiences, setAudiences] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [catRes, audRes, colRes, sizeRes] = await Promise.all([
        axios.get(`${API_URL}/categories/tree/`),
        axios.get(`${API_URL}/audiences/`),
        axios.get(`${API_URL}/colors/`),
        axios.get(`${API_URL}/sizes/`),
      ]);
      setCategoryTree(catRes.data);
      setAudiences(audRes.data);
      setColors(colRes.data);
      setSizes(sizeRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching options:', error);
      setLoading(false);
    }
  };

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAllMatchingCategories = (categories, searchTerm, path = []) => {
    let toExpand = {};
    for (const cat of categories) {
      const matches = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = cat.children?.some(child =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.children?.some(grandchild =>
          grandchild.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      if (matches || hasMatchingChildren) {
        path.forEach(id => { toExpand[id] = true; });
        toExpand[cat.id] = true;
      }

      if (cat.children?.length > 0) {
        const childExpansions = expandAllMatchingCategories(cat.children, searchTerm, [...path, cat.id]);
        toExpand = { ...toExpand, ...childExpansions };
      }
    }
    return toExpand;
  };

  useEffect(() => {
    if (categorySearch.length >= 2) {
      const expansions = expandAllMatchingCategories(categoryTree, categorySearch);
      setExpandedCategories(expansions);
    } else if (categorySearch.length === 0) {
      setExpandedCategories({});
    }
  }, [categorySearch, categoryTree]);

  const toggleColor = (colorId) => {
    setSelectedColors(prev => prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]);
  };

  const toggleSize = (sizeId) => {
    setSelectedSizes(prev => prev.includes(sizeId) ? prev.filter(id => id !== sizeId) : [...prev, sizeId]);
  };

  const findCategoryById = (tree, id) => {
    for (const cat of tree) {
      if (cat.id === id) return cat;
      if (cat.children?.length > 0) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getCategoryPath = (tree, id) => {
    const cat = findCategoryById(tree, id);
    return cat?.full_path || cat?.name || '';
  };

  const categoryMatchesSearch = (cat, searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return true;
    const term = searchTerm.toLowerCase();
    if (cat.name.toLowerCase().includes(term)) return true;
    if (cat.children?.some(child => categoryMatchesSearch(child, searchTerm))) return true;
    return false;
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories
      .filter(cat => categoryMatchesSearch(cat, categorySearch))
      .map(cat => {
        const hasChildren = cat.children?.length > 0;
        const isExpanded = expandedCategories[cat.id];
        const isSelected = selectedCategory === cat.id;
        const matchesSearch = categorySearch.length >= 2 &&
          cat.name.toLowerCase().includes(categorySearch.toLowerCase());

        return (
          <div key={cat.id}>
            <div
              style={{
                ...styles.categoryItem,
                paddingLeft: `${16 + level * 24}px`,
                ...(isSelected ? styles.categoryItemSelected : {}),
                ...(matchesSearch ? styles.categoryItemHighlight : {})
              }}
            >
              {hasChildren ? (
                <span
                  style={styles.expandIcon}
                  onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(cat.id); }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
              ) : <span style={styles.expandIconPlaceholder}>•</span>}
              <span
                style={{ ...styles.categoryName, ...(level > 0 ? { color: '#475569' } : {}) }}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
              >
                {cat.name}
              </span>
              {isSelected && <span style={styles.checkMark}>✓</span>}
            </div>
            {hasChildren && isExpanded && (
              <div style={styles.categoryChildren}>
                {renderCategoryTree(cat.children, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const formData = new FormData();
      formData.append('image', img.file);
      try {
        const response = await axios.post(`${API_URL}/upload/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          urls.push(response.data.url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Пожалуйста, введите название товара');
      return;
    }
    if (!retailPrice || parseFloat(retailPrice) <= 0) {
      alert('Пожалуйста, введите цену розница');
      return;
    }
    if (!wholesalePrice || parseFloat(wholesalePrice) <= 0) {
      alert('Пожалуйста, введите цену оптом');
      return;
    }

    setSubmitting(true);

    try {
      let uploadedUrls = [];
      if (images.length > 0) {
        setUploadingImages(true);
        uploadedUrls = await uploadImages();
        setUploadingImages(false);
      }

      const productData = {
        name,
        description,
        retail_price: parseFloat(retailPrice),
        wholesale_price: parseFloat(wholesalePrice),
        category: selectedCategory,
        audience: selectedAudience,
        brand_name: showBrand && brandName.trim() ? brandName.trim() : null,
        stock_quantity: showStock && stockQuantity ? parseInt(stockQuantity) : 0,
        discount_percent: showDiscount && discountPercent ? parseFloat(discountPercent) : 0,
        color_ids: selectedColors,
        size_ids: showSizes ? selectedSizes : [],
        image_urls: uploadedUrls,
      };

      await axios.post(`${API_URL}/products/`, productData);
      navigate('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Ошибка при создании товара');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div style={styles.toggleContainer} onClick={() => onChange(!checked)}>
      <div style={{
        ...styles.toggleSwitch,
        backgroundColor: checked ? '#FF6B35' : '#E5E7EB'
      }}>
        <div style={{
          ...styles.toggleKnob,
          transform: checked ? 'translateX(20px)' : 'translateX(0)'
        }} />
      </div>
      <span style={styles.toggleLabel}>{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/products')}>
          ← Назад к товарам
        </button>
        <h1 style={styles.title}>Добавить товар</h1>
        <p style={styles.subtitle}>Заполните информацию о новом товаре. Артикул (SKU) будет сгенерирован автоматически.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Основная информация</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Название товара *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Введите название товара"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="Введите описание товара"
              rows={4}
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Цены</h2>
          <div style={styles.priceRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Цена розница (₽) *</label>
              <input
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                style={styles.input}
                placeholder="0"
                step="1"
                min="1"
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Цена оптом (₽) *</label>
              <input
                type="number"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                style={styles.input}
                placeholder="0"
                step="1"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Optional Fields with Toggles */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Дополнительные параметры</h2>

          {/* Discount Toggle */}
          <div style={styles.toggleSection}>
            <ToggleSwitch
              checked={showDiscount}
              onChange={setShowDiscount}
              label="Скидка"
            />
            {showDiscount && (
              <div style={styles.toggleContent}>
                <div style={styles.inputGroupSmall}>
                  <label style={styles.labelSmall}>Размер скидки (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    style={styles.inputSmall}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stock Toggle */}
          <div style={styles.toggleSection}>
            <ToggleSwitch
              checked={showStock}
              onChange={setShowStock}
              label="Остаток на складе"
            />
            {showStock && (
              <div style={styles.toggleContent}>
                <div style={styles.inputGroupSmall}>
                  <label style={styles.labelSmall}>Количество</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    style={styles.inputSmall}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Brand Toggle */}
          <div style={styles.toggleSection}>
            <ToggleSwitch
              checked={showBrand}
              onChange={setShowBrand}
              label="Бренд"
            />
            {showBrand && (
              <div style={styles.toggleContent}>
                <div style={styles.inputGroupSmall}>
                  <label style={styles.labelSmall}>Название бренда</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    style={styles.inputSmall}
                    placeholder="Введите название бренда"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sizes Toggle */}
          <div style={styles.toggleSection}>
            <ToggleSwitch
              checked={showSizes}
              onChange={setShowSizes}
              label="Размеры"
            />
            {showSizes && (
              <div style={styles.toggleContent}>
                <p style={styles.sectionHint}>Выберите доступные размеры</p>
                <div style={styles.optionsGrid}>
                  {sizes.map(size => {
                    const isSelected = selectedSizes.includes(size.id);
                    return (
                      <div
                        key={size.id}
                        style={{
                          ...styles.sizeCard,
                          ...(isSelected ? styles.sizeCardSelected : {})
                        }}
                        onClick={() => toggleSize(size.id)}
                      >
                        {size.name}
                        {isSelected && <span style={styles.sizeCheck}> ✓</span>}
                      </div>
                    );
                  })}
                </div>
                {selectedSizes.length > 0 && (
                  <div style={styles.selectedInfo}>Выбрано размеров: <strong>{selectedSizes.length}</strong></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Категория</h2>
          <div style={styles.categorySearchContainer}>
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              style={styles.categorySearchInput}
              placeholder="Поиск категории..."
            />
            {categorySearch && (
              <button
                type="button"
                style={styles.clearSearchBtn}
                onClick={() => setCategorySearch('')}
              >
                ✕
              </button>
            )}
          </div>
          <div style={styles.categoryTreeContainer}>
            {renderCategoryTree(categoryTree)}
          </div>
          {selectedCategory && (
            <div style={styles.selectedCategoryInfo}>
              <span style={styles.selectedCategoryPath}>
                {getCategoryPath(categoryTree, selectedCategory)}
              </span>
              <button
                type="button"
                style={styles.clearCategoryBtn}
                onClick={() => setSelectedCategory(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Audience Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Аудитория</h2>
          <div style={styles.optionsGrid}>
            {audiences.map(aud => (
              <div
                key={aud.id}
                style={{
                  ...styles.optionCard,
                  ...(selectedAudience === aud.id ? styles.optionCardSelected : {})
                }}
                onClick={() => setSelectedAudience(selectedAudience === aud.id ? null : aud.id)}
              >
                {aud.name}
              </div>
            ))}
          </div>
        </div>

        {/* Colors Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Цвета</h2>
          <p style={styles.sectionHint}>Можно выбрать несколько цветов</p>
          <div style={styles.colorGrid}>
            {colors.map(color => {
              const isSelected = selectedColors.includes(color.id);
              return (
                <div
                  key={color.id}
                  style={{ ...styles.colorCard, ...(isSelected ? styles.colorCardSelected : {}) }}
                  onClick={() => toggleColor(color.id)}
                >
                  <div style={{ ...styles.colorSwatch, backgroundColor: color.hex_code || '#ccc' }}>
                    {isSelected && <span style={styles.colorCheck}>✓</span>}
                  </div>
                  <span style={styles.colorName}>{color.name}</span>
                </div>
              );
            })}
          </div>
          {selectedColors.length > 0 && (
            <div style={styles.selectedInfo}>Выбрано цветов: <strong>{selectedColors.length}</strong></div>
          )}
        </div>

        {/* Images Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Изображения</h2>
          <div style={styles.imageUploadArea}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={styles.fileInput}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={styles.uploadLabel}>
              <span style={styles.uploadIcon}>+</span>
              <span>Нажмите для загрузки</span>
              <span style={styles.uploadHint}>PNG, JPG до 10MB</span>
            </label>
          </div>
          {images.length > 0 && (
            <div style={styles.imagePreviewGrid}>
              {images.map((img, index) => (
                <div key={index} style={styles.imagePreview}>
                  <img src={img.preview} alt={`Preview ${index}`} style={styles.previewImg} />
                  {index === 0 && <span style={styles.primaryBadge}>Главное</span>}
                  <button
                    type="button"
                    style={styles.removeImageBtn}
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div style={styles.submitSection}>
          <button
            type="button"
            style={styles.cancelButton}
            onClick={() => navigate('/products')}
          >
            Отмена
          </button>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={submitting}
          >
            {uploadingImages ? 'Загрузка изображений...' : submitting ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
  },
  header: {
    marginBottom: '32px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#FF6B35',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
    marginBottom: '16px',
    display: 'block',
    fontWeight: '500',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6B7280',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    color: '#6B7280',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #F3F4F6',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionHint: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  // Toggle styles
  toggleSection: {
    padding: '16px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  toggleSwitch: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative',
    transition: 'background-color 0.2s ease',
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  toggleContent: {
    marginTop: '16px',
    paddingLeft: '56px',
  },
  // Input styles
  inputGroup: {
    marginBottom: '20px',
    flex: 1,
  },
  inputGroupSmall: {
    maxWidth: '300px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  labelSmall: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    color: '#1A1A1A',
    fontSize: '15px',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  inputSmall: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    color: '#1A1A1A',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    color: '#1A1A1A',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  priceRow: {
    display: 'flex',
    gap: '20px',
  },
  // Category styles
  categorySearchContainer: {
    position: 'relative',
    marginBottom: '12px',
  },
  categorySearchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1A1A1A',
    boxSizing: 'border-box',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  categoryTreeContainer: {
    maxHeight: '350px',
    overflowY: 'auto',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    backgroundColor: '#F9FAFB',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderBottom: '1px solid #E5E7EB',
  },
  categoryItemSelected: {
    backgroundColor: '#FFF4F0',
    borderLeft: '3px solid #FF6B35',
  },
  categoryItemHighlight: {
    backgroundColor: '#FEF3C7',
  },
  expandIcon: {
    width: '24px',
    fontSize: '10px',
    color: '#FF6B35',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIconPlaceholder: {
    width: '24px',
    color: '#D1D5DB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: '14px',
    color: '#1A1A1A',
    fontWeight: '500',
  },
  checkMark: {
    color: '#FF6B35',
    fontWeight: 'bold',
    marginLeft: '8px',
    fontSize: '16px',
  },
  categoryChildren: {
    backgroundColor: 'rgba(255, 107, 53, 0.02)',
  },
  selectedCategoryInfo: {
    marginTop: '12px',
    padding: '12px 16px',
    backgroundColor: '#FFF4F0',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  selectedCategoryPath: {
    flex: 1,
    fontSize: '14px',
    color: '#FF6B35',
    fontWeight: '500',
  },
  clearCategoryBtn: {
    background: 'none',
    border: 'none',
    color: '#FF6B35',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
  },
  // Option styles
  optionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  optionCard: {
    padding: '10px 18px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    color: '#6B7280',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  optionCardSelected: {
    borderColor: '#FF6B35',
    color: '#FF6B35',
    backgroundColor: '#FFF4F0',
  },
  sizeCard: {
    padding: '10px 18px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    color: '#6B7280',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    minWidth: '50px',
    textAlign: 'center',
  },
  sizeCardSelected: {
    borderColor: '#FF6B35',
    color: '#FF6B35',
    backgroundColor: '#FFF4F0',
  },
  sizeCheck: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  selectedInfo: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#FFF4F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#FF6B35',
  },
  // Color styles
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  colorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  colorCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF4F0',
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheck: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  colorName: {
    color: '#6B7280',
    fontSize: '13px',
  },
  // Image styles
  imageUploadArea: {
    position: 'relative',
    marginBottom: '20px',
  },
  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#F9FAFB',
    border: '2px dashed #D1D5DB',
    borderRadius: '12px',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  uploadIcon: {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#9CA3AF',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  imagePreviewGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  imagePreview: {
    position: 'relative',
    width: '120px',
    height: '120px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    padding: '2px 8px',
    backgroundColor: '#FF6B35',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '4px',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    backgroundColor: '#EF4444',
    border: 'none',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  // Submit styles
  submitSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: '#FF6B35',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
};

export default AddProduct;
