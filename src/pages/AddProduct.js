import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Product type: 'simple' or 'variants'
  const [productType, setProductType] = useState('simple');

  // Basic product fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [brandName, setBrandName] = useState('');

  // Toggle states
  const [showDiscount, setShowDiscount] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showBrand, setShowBrand] = useState(false);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [images, setImages] = useState([]);

  // Category attributes from variant system
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Selected attribute values for simple product
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

  // Variants for product with variants
  const [variants, setVariants] = useState([]);

  // Options data
  const [categoryTree, setCategoryTree] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categorySearch, setCategorySearch] = useState('');
  const [audiences, setAudiences] = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Fetch category attributes when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryAttributes(selectedCategory);
    } else {
      setCategoryAttributes([]);
      setVariantAttributes([]);
      setSelectedAttributeValues({});
      setVariants([]);
    }
  }, [selectedCategory]);

  const fetchOptions = async () => {
    try {
      const [catRes, audRes, colRes] = await Promise.all([
        axios.get(`${API_URL}/categories/tree/`),
        axios.get(`${API_URL}/audiences/`),
        axios.get(`${API_URL}/colors/`),
      ]);
      setCategoryTree(catRes.data);
      setAudiences(audRes.data);
      setColors(colRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching options:', error);
      setLoading(false);
    }
  };

  const fetchCategoryAttributes = async (categoryId) => {
    setLoadingAttributes(true);
    try {
      const response = await axios.get(`${API_URL}/categories/${categoryId}/attributes/`);
      if (response.data.success) {
        const attrs = response.data.category.attributes || [];
        const variantAttrs = response.data.category.variant_attributes || [];
        setCategoryAttributes(attrs);
        setVariantAttributes(variantAttrs);
      }
    } catch (error) {
      console.error('Error fetching category attributes:', error);
      setCategoryAttributes([]);
      setVariantAttributes([]);
    }
    setLoadingAttributes(false);
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

  // Handle attribute value selection for simple product
  const handleAttributeValueSelect = (attributeId, valueId) => {
    setSelectedAttributeValues(prev => ({
      ...prev,
      [attributeId]: valueId
    }));
  };

  // Add a new variant
  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      attributeValues: {},
      price: '',
      compareAtPrice: '',
      stockQuantity: '0',
    };
    setVariants(prev => [...prev, newVariant]);
  };

  // Update variant field
  const updateVariant = (variantId, field, value) => {
    setVariants(prev => prev.map(v =>
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  // Update variant attribute value
  const updateVariantAttributeValue = (variantId, attributeId, valueId) => {
    setVariants(prev => prev.map(v =>
      v.id === variantId
        ? { ...v, attributeValues: { ...v.attributeValues, [attributeId]: valueId } }
        : v
    ));
  };

  // Remove variant
  const removeVariant = (variantId) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  // Generate variant name from attributes
  const getVariantName = (variant) => {
    const parts = [];
    for (const attr of variantAttributes) {
      const valueId = variant.attributeValues[attr.id];
      if (valueId) {
        const value = attr.values?.find(v => v.id === valueId);
        if (value) {
          parts.push(value.display_value || value.value);
        }
      }
    }
    return parts.length > 0 ? parts.join(' / ') : 'Вариант';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Пожалуйста, введите название товара');
      return;
    }

    if (productType === 'simple') {
      if (!retailPrice || parseFloat(retailPrice) <= 0) {
        alert('Пожалуйста, введите цену розница');
        return;
      }
      if (!wholesalePrice || parseFloat(wholesalePrice) <= 0) {
        alert('Пожалуйста, введите цену оптом');
        return;
      }
    } else {
      if (variants.length === 0) {
        alert('Пожалуйста, добавьте хотя бы один вариант');
        return;
      }
      for (const variant of variants) {
        if (!variant.price || parseFloat(variant.price) <= 0) {
          alert('Пожалуйста, укажите цену для всех вариантов');
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      let uploadedUrls = [];
      if (images.length > 0) {
        setUploadingImages(true);
        uploadedUrls = await uploadImages();
        setUploadingImages(false);
      }

      if (productType === 'simple') {
        const productData = {
          name,
          description,
          characteristics,
          retail_price: parseFloat(retailPrice),
          wholesale_price: parseFloat(wholesalePrice),
          category: selectedCategory,
          audience: selectedAudience,
          brand_name: showBrand && brandName.trim() ? brandName.trim() : null,
          stock_quantity: showStock && stockQuantity ? parseInt(stockQuantity) : 0,
          discount_percent: showDiscount && discountPercent ? parseFloat(discountPercent) : 0,
          color_ids: selectedColors,
          image_urls: uploadedUrls,
          is_simple: true,
        };

        await axios.post(`${API_URL}/products/`, productData);
      } else {
        const productData = {
          name,
          description,
          characteristics,
          category: selectedCategory,
          audience: selectedAudience,
          brand_name: showBrand && brandName.trim() ? brandName.trim() : null,
          image_urls: uploadedUrls,
          is_simple: false,
          variants: variants.map(v => ({
            attribute_values: Object.values(v.attributeValues).filter(Boolean),
            price: parseFloat(v.price),
            compare_at_price: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
            stock_quantity: parseInt(v.stockQuantity) || 0,
          }))
        };

        await axios.post(`${API_URL}/products/create-with-variants/`, productData);
      }

      navigate('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Ошибка при создании товара');
    } finally {
      setSubmitting(false);
    }
  };

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

  const renderAttributeSelector = (attribute, selectedValue, onSelect) => {
    const attrType = attribute.attribute_type?.code || 'select';

    if (attrType === 'color') {
      return (
        <div style={styles.colorGrid}>
          {attribute.values?.map(value => {
            const isSelected = selectedValue === value.id;
            const hexCode = value.extra_data?.hex_code || value.hex_code || '#ccc';
            return (
              <div
                key={value.id}
                style={{
                  ...styles.colorOption,
                  ...(isSelected ? styles.colorOptionSelected : {})
                }}
                onClick={() => onSelect(value.id)}
              >
                <div style={{ ...styles.colorSwatch, backgroundColor: hexCode }}>
                  {isSelected && <span style={styles.colorCheck}>✓</span>}
                </div>
                <span style={styles.colorName}>{value.display_value || value.value}</span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div style={styles.optionsGrid}>
        {attribute.values?.map(value => {
          const isSelected = selectedValue === value.id;
          return (
            <div
              key={value.id}
              style={{
                ...styles.optionCard,
                ...(isSelected ? styles.optionCardSelected : {})
              }}
              onClick={() => onSelect(value.id)}
            >
              {value.display_value || value.value}
              {attribute.unit && ` ${attribute.unit}`}
            </div>
          );
        })}
      </div>
    );
  };

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
        <p style={styles.subtitle}>Заполните информацию о новом товаре</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info */}
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
          <div style={styles.inputGroup}>
            <label style={styles.label}>Характеристики</label>
            <textarea
              value={characteristics}
              onChange={(e) => setCharacteristics(e.target.value)}
              style={styles.textarea}
              placeholder="Введите характеристики"
              rows={6}
            />
          </div>
        </div>

        {/* Category */}
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
              <button type="button" style={styles.clearSearchBtn} onClick={() => setCategorySearch('')}>✕</button>
            )}
          </div>
          <div style={styles.categoryTreeContainer}>
            {renderCategoryTree(categoryTree)}
          </div>
          {selectedCategory && (
            <div style={styles.selectedCategoryInfo}>
              <span style={styles.selectedCategoryPath}>{getCategoryPath(categoryTree, selectedCategory)}</span>
              <button type="button" style={styles.clearCategoryBtn} onClick={() => setSelectedCategory(null)}>✕</button>
            </div>
          )}

          {loadingAttributes && <div style={styles.loadingAttributes}>Загрузка атрибутов...</div>}

          {selectedCategory && variantAttributes.length > 0 && (
            <div style={styles.variantAttributesInfo}>
              <span>Категория поддерживает варианты: <strong>{variantAttributes.map(a => a.name).join(', ')}</strong></span>
            </div>
          )}
        </div>

        {/* Product Type Selection */}
        {selectedCategory && variantAttributes.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Тип товара</h2>
            <div style={styles.productTypeSelector}>
              <div
                style={{ ...styles.productTypeOption, ...(productType === 'simple' ? styles.productTypeOptionSelected : {}) }}
                onClick={() => setProductType('simple')}
              >
                <div style={styles.productTypeContent}>
                  <h4 style={styles.productTypeTitle}>Простой товар</h4>
                  <p style={styles.productTypeDesc}>Один вариант с фиксированной ценой</p>
                </div>
                {productType === 'simple' && <span style={styles.productTypeCheck}>✓</span>}
              </div>
              <div
                style={{ ...styles.productTypeOption, ...(productType === 'variants' ? styles.productTypeOptionSelected : {}) }}
                onClick={() => setProductType('variants')}
              >
                <div style={styles.productTypeContent}>
                  <h4 style={styles.productTypeTitle}>Товар с вариантами</h4>
                  <p style={styles.productTypeDesc}>Несколько вариантов ({variantAttributes.map(a => a.name).join(', ')})</p>
                </div>
                {productType === 'variants' && <span style={styles.productTypeCheck}>✓</span>}
              </div>
            </div>
          </div>
        )}

        {/* Pricing (simple products) */}
        {productType === 'simple' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Цены</h2>
            <div style={styles.priceRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Цена розница (₽) *</label>
                <input type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} style={styles.input} placeholder="0" min="1" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Цена оптом (₽) *</label>
                <input type="number" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} style={styles.input} placeholder="0" min="1" required />
              </div>
            </div>
          </div>
        )}

        {/* Category Attributes (simple products) */}
        {productType === 'simple' && categoryAttributes.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Атрибуты товара</h2>
            {categoryAttributes.map(attr => (
              <div key={attr.id} style={styles.attributeGroup}>
                <label style={styles.label}>{attr.name}{attr.is_required && <span style={styles.requiredStar}> *</span>}</label>
                {renderAttributeSelector(attr, selectedAttributeValues[attr.id], (valueId) => handleAttributeValueSelect(attr.id, valueId))}
              </div>
            ))}
          </div>
        )}

        {/* Variants Section */}
        {productType === 'variants' && variantAttributes.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Варианты товара</h2>
              <button type="button" style={styles.addVariantBtn} onClick={addVariant}>+ Добавить вариант</button>
            </div>

            {variants.length === 0 ? (
              <div style={styles.emptyVariants}>
                <p>Нет вариантов. Нажмите "Добавить вариант"</p>
              </div>
            ) : (
              <div style={styles.variantsList}>
                {variants.map((variant, index) => (
                  <div key={variant.id} style={styles.variantCard}>
                    <div style={styles.variantHeader}>
                      <span style={styles.variantNumber}>Вариант {index + 1}</span>
                      <span style={styles.variantName}>{getVariantName(variant)}</span>
                      <button type="button" style={styles.removeVariantBtn} onClick={() => removeVariant(variant.id)}>✕</button>
                    </div>

                    <div style={styles.variantAttributes}>
                      {variantAttributes.map(attr => (
                        <div key={attr.id} style={styles.variantAttributeGroup}>
                          <label style={styles.labelSmall}>{attr.name}</label>
                          {renderAttributeSelector(attr, variant.attributeValues[attr.id], (valueId) => updateVariantAttributeValue(variant.id, attr.id, valueId))}
                        </div>
                      ))}
                    </div>

                    <div style={styles.variantPricing}>
                      <div style={styles.variantPriceGroup}>
                        <label style={styles.labelSmall}>Цена (₽) *</label>
                        <input type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} style={styles.inputSmall} placeholder="0" min="1" />
                      </div>
                      <div style={styles.variantPriceGroup}>
                        <label style={styles.labelSmall}>Старая цена</label>
                        <input type="number" value={variant.compareAtPrice} onChange={(e) => updateVariant(variant.id, 'compareAtPrice', e.target.value)} style={styles.inputSmall} placeholder="0" />
                      </div>
                      <div style={styles.variantPriceGroup}>
                        <label style={styles.labelSmall}>Остаток</label>
                        <input type="number" value={variant.stockQuantity} onChange={(e) => updateVariant(variant.id, 'stockQuantity', e.target.value)} style={styles.inputSmall} placeholder="0" min="0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Options */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Дополнительные параметры</h2>

          {productType === 'simple' && (
            <>
              <div style={styles.toggleSection}>
                <ToggleSwitch checked={showDiscount} onChange={setShowDiscount} label="Скидка" />
                {showDiscount && (
                  <div style={styles.toggleContent}>
                    <div style={styles.inputGroupSmall}>
                      <label style={styles.labelSmall}>Размер скидки (%)</label>
                      <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} style={styles.inputSmall} placeholder="0" min="0" max="100" />
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.toggleSection}>
                <ToggleSwitch checked={showStock} onChange={setShowStock} label="Остаток на складе" />
                {showStock && (
                  <div style={styles.toggleContent}>
                    <div style={styles.inputGroupSmall}>
                      <label style={styles.labelSmall}>Количество</label>
                      <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} style={styles.inputSmall} placeholder="0" min="0" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={styles.toggleSection}>
            <ToggleSwitch checked={showBrand} onChange={setShowBrand} label="Бренд" />
            {showBrand && (
              <div style={styles.toggleContent}>
                <div style={styles.inputGroupSmall}>
                  <label style={styles.labelSmall}>Название бренда</label>
                  <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} style={styles.inputSmall} placeholder="Введите название бренда" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audience */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Аудитория</h2>
          <div style={styles.optionsGrid}>
            {audiences.map(aud => (
              <div
                key={aud.id}
                style={{ ...styles.optionCard, ...(selectedAudience === aud.id ? styles.optionCardSelected : {}) }}
                onClick={() => setSelectedAudience(selectedAudience === aud.id ? null : aud.id)}
              >
                {aud.name}
              </div>
            ))}
          </div>
        </div>

        {/* Colors (legacy, for simple products without color attribute) */}
        {productType === 'simple' && !categoryAttributes.some(a => a.attribute_type?.code === 'color') && (
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
          </div>
        )}

        {/* Images */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Изображения</h2>
          <div style={styles.imageUploadArea}>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} style={styles.fileInput} id="image-upload" />
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
                  <button type="button" style={styles.removeImageBtn} onClick={() => removeImage(index)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={styles.submitSection}>
          <button type="button" style={styles.cancelButton} onClick={() => navigate('/products')}>Отмена</button>
          <button type="submit" style={styles.submitButton} disabled={submitting}>
            {uploadingImages ? 'Загрузка изображений...' : submitting ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px' },
  header: { marginBottom: '32px' },
  backButton: { background: 'none', border: 'none', color: '#FF6B35', fontSize: '14px', cursor: 'pointer', padding: '0', marginBottom: '16px', display: 'block', fontWeight: '500' },
  title: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#1A1A1A' },
  subtitle: { margin: 0, fontSize: '14px', color: '#6B7280' },
  loading: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#6B7280' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #F3F4F6', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  section: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#1A1A1A' },
  sectionHint: { margin: '0 0 12px 0', fontSize: '13px', color: '#9CA3AF' },
  productTypeSelector: { display: 'flex', gap: '16px' },
  productTypeOption: { flex: 1, display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease' },
  productTypeOptionSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF4F0' },
  productTypeContent: { flex: 1 },
  productTypeTitle: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1A1A1A' },
  productTypeDesc: { margin: 0, fontSize: '13px', color: '#6B7280' },
  productTypeCheck: { color: '#FF6B35', fontWeight: 'bold', fontSize: '18px' },
  toggleSection: { padding: '16px 0', borderBottom: '1px solid #F3F4F6' },
  toggleContainer: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  toggleSwitch: { width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s ease' },
  toggleKnob: { width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  toggleLabel: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  toggleContent: { marginTop: '16px', paddingLeft: '56px' },
  inputGroup: { marginBottom: '20px', flex: 1 },
  inputGroupSmall: { maxWidth: '300px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' },
  labelSmall: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#6B7280' },
  requiredStar: { color: '#EF4444' },
  input: { width: '100%', padding: '12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', color: '#1A1A1A', fontSize: '15px', boxSizing: 'border-box' },
  inputSmall: { width: '100%', padding: '10px 14px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#1A1A1A', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', color: '#1A1A1A', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  priceRow: { display: 'flex', gap: '20px' },
  attributeGroup: { marginBottom: '24px' },
  loadingAttributes: { marginTop: '12px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '14px', color: '#6B7280', textAlign: 'center' },
  variantAttributesInfo: { marginTop: '12px', padding: '12px 16px', backgroundColor: '#EFF6FF', borderRadius: '8px', fontSize: '14px', color: '#1E40AF' },
  addVariantBtn: { padding: '10px 20px', backgroundColor: '#FF6B35', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  emptyVariants: { padding: '40px', backgroundColor: '#F9FAFB', borderRadius: '12px', textAlign: 'center', color: '#6B7280' },
  variantsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  variantCard: { padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' },
  variantHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E5E7EB' },
  variantNumber: { fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  variantName: { flex: 1, fontSize: '15px', fontWeight: '600', color: '#1A1A1A' },
  removeVariantBtn: { width: '28px', height: '28px', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '50%', color: '#EF4444', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  variantAttributes: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' },
  variantAttributeGroup: {},
  variantPricing: { display: 'flex', gap: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' },
  variantPriceGroup: { flex: 1 },
  categorySearchContainer: { position: 'relative', marginBottom: '12px' },
  categorySearchInput: { width: '100%', padding: '12px 40px 12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' },
  clearSearchBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px', padding: '4px' },
  categoryTreeContainer: { maxHeight: '350px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', backgroundColor: '#F9FAFB' },
  categoryItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s ease', borderBottom: '1px solid #E5E7EB' },
  categoryItemSelected: { backgroundColor: '#FFF4F0', borderLeft: '3px solid #FF6B35' },
  categoryItemHighlight: { backgroundColor: '#FEF3C7' },
  expandIcon: { width: '24px', fontSize: '10px', color: '#FF6B35', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  expandIconPlaceholder: { width: '24px', color: '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  categoryName: { flex: 1, fontSize: '14px', color: '#1A1A1A', fontWeight: '500' },
  checkMark: { color: '#FF6B35', fontWeight: 'bold', marginLeft: '8px', fontSize: '16px' },
  categoryChildren: { backgroundColor: 'rgba(255, 107, 53, 0.02)' },
  selectedCategoryInfo: { marginTop: '12px', padding: '12px 16px', backgroundColor: '#FFF4F0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  selectedCategoryPath: { flex: 1, fontSize: '14px', color: '#FF6B35', fontWeight: '500' },
  clearCategoryBtn: { background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' },
  optionsGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  optionCard: { padding: '10px 18px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#6B7280', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s ease', userSelect: 'none' },
  optionCardSelected: { borderColor: '#FF6B35', color: '#FF6B35', backgroundColor: '#FFF4F0' },
  colorGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  colorCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease', userSelect: 'none' },
  colorCardSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF4F0' },
  colorOption: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease', userSelect: 'none' },
  colorOptionSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF4F0' },
  colorSwatch: { width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  colorCheck: { color: '#fff', fontSize: '12px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
  colorName: { color: '#6B7280', fontSize: '13px' },
  imageUploadArea: { position: 'relative', marginBottom: '20px' },
  fileInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#F9FAFB', border: '2px dashed #D1D5DB', borderRadius: '12px', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s ease' },
  uploadIcon: { fontSize: '32px', marginBottom: '8px', color: '#9CA3AF' },
  uploadHint: { fontSize: '12px', color: '#9CA3AF', marginTop: '4px' },
  imagePreviewGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  imagePreview: { position: 'relative', width: '120px', height: '120px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  primaryBadge: { position: 'absolute', bottom: '6px', left: '6px', padding: '2px 8px', backgroundColor: '#FF6B35', color: '#fff', fontSize: '10px', fontWeight: '600', borderRadius: '4px' },
  removeImageBtn: { position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', backgroundColor: '#EF4444', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  submitSection: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' },
  cancelButton: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', color: '#6B7280', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease' },
  submitButton: { padding: '12px 32px', backgroundColor: '#FF6B35', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.15s ease' },
};

export default AddProduct;
