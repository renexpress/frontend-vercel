import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function AddProduct() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [images, setImages] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);
  const [status, setStatus] = useState('active');
  const [statusOpen, setStatusOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Price state
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');
  const [unit, setUnit] = useState('шт');
  const [unitOpen, setUnitOpen] = useState(false);

  const units = ['шт', 'кг', 'г', 'л', 'мл', 'м', 'см', 'упак'];

  // Inventory state
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [maxOrderQuantity, setMaxOrderQuantity] = useState('');

  // Shipping state
  const [isPhysicalProduct, setIsPhysicalProduct] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('default');
  const [packageOpen, setPackageOpen] = useState(false);
  const [productWeight, setProductWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('кг');
  const [weightUnitOpen, setWeightUnitOpen] = useState(false);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantOptions, setVariantOptions] = useState([{ name: '', values: [''] }]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);

  const availableColors = [
    { name: 'Красный', hex: '#e53935' },
    { name: 'Розовый', hex: '#ec407a' },
    { name: 'Фиолетовый', hex: '#ab47bc' },
    { name: 'Синий', hex: '#1e88e5' },
    { name: 'Голубой', hex: '#29b6f6' },
    { name: 'Бирюзовый', hex: '#26a69a' },
    { name: 'Зелёный', hex: '#66bb6a' },
    { name: 'Жёлтый', hex: '#ffee58' },
    { name: 'Оранжевый', hex: '#ffa726' },
    { name: 'Коричневый', hex: '#8d6e63' },
    { name: 'Серый', hex: '#bdbdbd' },
    { name: 'Чёрный', hex: '#212121' },
    { name: 'Белый', hex: '#fafafa' },
  ];

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, { name: '', values: [''] }]);
  };

  const removeVariantOption = (index) => {
    const newOptions = variantOptions.filter((_, i) => i !== index);
    setVariantOptions(newOptions.length ? newOptions : [{ name: '', values: [''] }]);
  };

  const updateOptionName = (index, name) => {
    const newOptions = [...variantOptions];
    newOptions[index].name = name;
    setVariantOptions(newOptions);
  };

  const addOptionValue = (optionIndex) => {
    const newOptions = [...variantOptions];
    newOptions[optionIndex].values.push('');
    setVariantOptions(newOptions);
  };

  const updateOptionValue = (optionIndex, valueIndex, value) => {
    const newOptions = [...variantOptions];
    newOptions[optionIndex].values[valueIndex] = value;
    setVariantOptions(newOptions);
  };

  const removeOptionValue = (optionIndex, valueIndex) => {
    const newOptions = [...variantOptions];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    if (newOptions[optionIndex].values.length === 0) {
      newOptions[optionIndex].values = [''];
    }
    setVariantOptions(newOptions);
  };

  const toggleColor = (color) => {
    if (selectedColors.find(c => c.hex === color.hex)) {
      setSelectedColors(selectedColors.filter(c => c.hex !== color.hex));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const saveVariants = () => {
    const validOptions = variantOptions.filter(opt => opt.name && opt.values.some(v => v));
    if (selectedColors.length > 0) {
      validOptions.push({ name: 'Цвет', values: selectedColors.map(c => c.name), colors: selectedColors });
    }
    setVariants(validOptions);
    setShowVariantForm(false);
  };

  const cancelVariants = () => {
    setShowVariantForm(false);
    setVariantOptions([{ name: '', values: [''] }]);
    setSelectedColors([]);
  };

  const packages = [
    { id: 'default', name: 'По умолчанию', size: '22 × 13.7 × 4.2 см, 0 кг' },
    { id: 'small', name: 'Маленькая коробка', size: '15 × 10 × 5 см' },
    { id: 'medium', name: 'Средняя коробка', size: '30 × 20 × 15 см' },
    { id: 'large', name: 'Большая коробка', size: '50 × 40 × 30 см' },
    { id: 'envelope', name: 'Конверт', size: '32 × 24 × 1 см' },
  ];

  const weightUnits = ['кг', 'г'];

  // Category state
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // Flattened list of all categories
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]); // Navigation stack
  const [currentCategories, setCurrentCategories] = useState([]); // Currently displayed categories
  const [categorySearch, setCategorySearch] = useState(''); // Search input

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/`);
      const data = await res.json();
      console.log('Categories API response:', data);
      const cats = Array.isArray(data) ? data : data.results || data.categories || [];
      console.log('Parsed categories:', cats);
      setCategories(cats);

      // Build flattened list with full paths for search
      try {
        const flattened = buildFlatCategories(cats);
        console.log('Setting allCategories:', flattened.length);
        setAllCategories(flattened);
      } catch (e) {
        console.error('Error flattening categories:', e);
      }

      // Show only root categories initially (parent_id is null or no parent)
      const rootCats = cats.filter(c => !c.parent_id && !c.parent);
      console.log('Root categories:', rootCats);
      setCurrentCategories(rootCats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Simple function to flatten categories
  const buildFlatCategories = (cats) => {
    const result = [];

    const processCategory = (cat, parentPath) => {
      const fullPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
      result.push({
        id: cat.id,
        name: cat.name,
        fullPath: fullPath,
        searchText: fullPath.toLowerCase(),
        parent_id: cat.parent_id,
        children: cat.children
      });

      if (cat.children && Array.isArray(cat.children)) {
        cat.children.forEach(child => processCategory(child, fullPath));
      }
    };

    // Process all categories
    cats.forEach(cat => {
      if (!cat.parent_id && !cat.parent) {
        processCategory(cat, '');
      }
    });

    // Also add any with parent_id that weren't processed
    cats.forEach(cat => {
      if (!result.find(r => r.id === cat.id)) {
        result.push({
          id: cat.id,
          name: cat.name,
          fullPath: cat.name,
          searchText: cat.name.toLowerCase(),
          parent_id: cat.parent_id
        });
      }
    });

    return result;
  };

  // Flatten all categories recursively to get full paths for search
  const flattenCategories = (cats) => {
    let result = [];

    // Build a map of id -> category for quick lookup
    const catMap = {};
    const addToMap = (list) => {
      for (const cat of list) {
        catMap[cat.id] = cat;
        if (cat.children && Array.isArray(cat.children)) {
          addToMap(cat.children);
        }
      }
    };
    addToMap(cats);

    // Get full path for a category
    const getFullPath = (cat) => {
      const parts = [cat.name];
      let current = cat;
      while (current.parent_id || current.parent) {
        const parentId = current.parent_id || current.parent;
        const parent = catMap[parentId];
        if (parent) {
          parts.unshift(parent.name);
          current = parent;
        } else {
          break;
        }
      }
      return parts.join(' > ');
    };

    // Recursively add all categories
    const processCategory = (cat, parentPath = '') => {
      const fullPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
      result.push({
        ...cat,
        fullPath,
        searchText: fullPath.toLowerCase()
      });

      if (cat.children && Array.isArray(cat.children)) {
        for (const child of cat.children) {
          processCategory(child, fullPath);
        }
      }
    };

    // Process root categories first
    const rootCats = cats.filter(c => !c.parent_id && !c.parent);
    for (const cat of rootCats) {
      processCategory(cat);
    }

    // Also add any categories that might be in flat structure with parent_id
    for (const cat of cats) {
      if (!result.find(r => r.id === cat.id)) {
        const fullPath = getFullPath(cat);
        result.push({
          ...cat,
          fullPath,
          searchText: fullPath.toLowerCase()
        });
      }
    }

    console.log('Flattened categories:', result);
    return result;
  };

  // Get filtered categories based on search
  const getFilteredCategories = () => {
    if (!categorySearch.trim()) {
      return null; // Return null to show normal navigation
    }
    const searchLower = categorySearch.toLowerCase().trim();

    const filtered = allCategories.filter(cat => {
      // Search for consecutive characters in category name or full path
      return cat.searchText.includes(searchLower);
    });

    // Limit results for performance
    return filtered.slice(0, 50);
  };

  const getChildCategories = (parentId) => {
    // First check if any category in the list has this as parent
    const filtered = categories.filter(c => c.parent_id === parentId || c.parent === parentId);
    if (filtered.length > 0) return filtered;

    // If not found by parent_id, check if the category itself has children array
    const parentCat = categories.find(c => c.id === parentId);
    if (parentCat && parentCat.children && Array.isArray(parentCat.children)) {
      return parentCat.children;
    }
    return [];
  };

  const hasSubcategories = (category) => {
    // Check if category has children array
    if (category.children && Array.isArray(category.children) && category.children.length > 0) {
      return true;
    }
    // Check if any category has this as parent
    return categories.some(c => c.parent_id === category.id || c.parent === category.id);
  };

  const handleCategoryClick = (category) => {
    if (hasSubcategories(category)) {
      // Has subcategories - navigate into
      const children = getChildCategories(category.id);
      // If children came from the category.children array, add them to main categories list
      if (category.children && Array.isArray(category.children) && category.children.length > 0) {
        setCategories(prev => {
          const existingIds = prev.map(c => c.id);
          const newCats = category.children.filter(c => !existingIds.includes(c.id));
          return [...prev, ...newCats];
        });
      }
      setCategoryPath(prev => [...prev, category]);
      setCurrentCategories(children);
    } else {
      // No subcategories - select this category
      setSelectedCategory(category);
      setCategoryOpen(false);
      setCategoryPath([]);
      const rootCats = categories.filter(c => !c.parent_id && !c.parent);
      setCurrentCategories(rootCats);
    }
  };

  const handleCategoryBack = () => {
    if (categoryPath.length === 0) return;

    const newPath = [...categoryPath];
    newPath.pop();
    setCategoryPath(newPath);

    if (newPath.length === 0) {
      // Back to root
      const rootCats = categories.filter(c => !c.parent_id && !c.parent);
      setCurrentCategories(rootCats);
    } else {
      // Show siblings of current level
      const parent = newPath[newPath.length - 1];
      setCurrentCategories(getChildCategories(parent.id));
    }
  };

  const openCategoryDropdown = () => {
    setCategoryOpen(true);
    setCategoryPath([]);
    setCategorySearch('');
    const rootCats = categories.filter(c => !c.parent_id && !c.parent);
    setCurrentCategories(rootCats);
  };

  // Handle selecting a category from search results
  const handleSearchCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setCategoryOpen(false);
    setCategoryPath([]);
    setCategorySearch('');
    const rootCats = categories.filter(c => !c.parent_id && !c.parent);
    setCurrentCategories(rootCats);
  };

  const handleImageUpload = (e) => {
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

  // Upload images to server and get URLs
  const uploadImages = async () => {
    const imageUrls = [];
    for (const img of images) {
      if (img.url) {
        // Already uploaded
        imageUrls.push(img.url);
      } else if (img.file) {
        // Need to upload
        const formData = new FormData();
        formData.append('image', img.file);
        try {
          const res = await fetch(`${API_URL}/upload/`, {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            imageUrls.push(data.url);
          } else {
            console.error('Upload failed:', res.status);
          }
        } catch (err) {
          console.error('Error uploading image:', err);
        }
      }
    }
    return imageUrls;
  };

  // Build variant options for API
  const buildVariantOptions = () => {
    if (variants.length === 0) return [];

    return variants.map(v => {
      const option = {
        name: v.name,
        values: v.values.filter(val => val), // Filter empty values
      };
      // If this is a color option, include color hex codes
      if (v.colors && v.colors.length > 0) {
        option.colors = v.colors.map(c => ({ hex: c.hex }));
      }
      return option;
    }).filter(opt => opt.name && opt.values.length > 0);
  };

  // Save product
  const handleSave = async (saveAsDraft = false) => {
    if (!title.trim()) {
      setError('Введите название товара');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      // Build product data with all fields
      const productData = {
        name: title.trim(),
        description: description.trim() || null,
        characteristics: characteristics.trim() || null,
        category: selectedCategory?.id || null,
        status: saveAsDraft ? 'draft' : status,
        retail_price: retailPrice ? parseFloat(retailPrice) : null,
        wholesale_price: wholesaleEnabled && wholesalePrice ? parseFloat(wholesalePrice) : null,
        discount_price: discountEnabled && discountPrice ? parseFloat(discountPrice) : null,
        unit: unit,
        track_inventory: trackInventory,
        stock_quantity: trackInventory && stockQuantity ? parseInt(stockQuantity) : 0,
        max_order_quantity: !trackInventory && maxOrderQuantity ? parseInt(maxOrderQuantity) : null,
        is_physical_product: isPhysicalProduct,
        package_type: isPhysicalProduct ? selectedPackage : null,
        weight: isPhysicalProduct && productWeight ? parseFloat(productWeight) : null,
        weight_unit: isPhysicalProduct ? weightUnit : null,
        image_urls: imageUrls,
        variant_options: buildVariantOptions(),
      };

      console.log('Sending product data:', productData);

      const res = await fetch(`${API_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const responseText = await res.text();
      console.log('Server response status:', res.status);
      console.log('Server response:', responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        if (saveAsDraft) {
          navigate('/products/drafts');
        } else {
          navigate(`/products/${data.id}`);
        }
      } else {
        // Try to parse as JSON, otherwise show raw text
        try {
          const errorData = JSON.parse(responseText);
          console.error('Server error:', errorData);
          setError(JSON.stringify(errorData));
        } catch {
          console.error('Server HTML error:', responseText);
          setError(`Ошибка сервера (${res.status}). Проверьте консоль.`);
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Ошибка сети: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <div style={styles.breadcrumbLeft} onClick={() => navigate('/products')}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#5c5f62">
            <path fillRule="evenodd" d="M2.5 2a1.5 1.5 0 00-1.5 1.5v4.586a1.5 1.5 0 00.44 1.06l6.998 7a1.5 1.5 0 002.121 0l4.586-4.586a1.5 1.5 0 000-2.121l-7-6.999a1.5 1.5 0 00-1.06-.44H2.5zm3.25 5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"/>
          </svg>
          <span style={styles.breadcrumbText}>Товары</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196" style={{ margin: '0 2px' }}>
          <path d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"/>
        </svg>
        <span style={styles.breadcrumbCurrent}>Добавить товар</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Left Column - Main Card */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            {/* Title */}
            <div style={styles.section}>
              <label style={styles.label}>Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                onMouseEnter={() => setHoveredField('title')}
                onMouseLeave={() => setHoveredField(null)}
                placeholder="Футболка с коротким рукавом"
                style={{
                  ...styles.input,
                  borderColor: focusedField === 'title' ? '#5c6ac4' : hoveredField === 'title' ? '#6d7175' : '#919eab',
                  backgroundColor: hoveredField === 'title' && focusedField !== 'title' ? '#fafbfc' : '#fff',
                  boxShadow: focusedField === 'title' ? '0 0 0 2px #5c6ac433' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            {/* Description */}
            <div style={styles.section}>
              <label style={styles.label}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                onMouseEnter={() => setHoveredField('description')}
                onMouseLeave={() => setHoveredField(null)}
                placeholder="Добавьте описание товара"
                rows={5}
                style={{
                  ...styles.textarea,
                  borderColor: focusedField === 'description' ? '#5c6ac4' : hoveredField === 'description' ? '#6d7175' : '#919eab',
                  backgroundColor: hoveredField === 'description' && focusedField !== 'description' ? '#fafbfc' : '#fff',
                  boxShadow: focusedField === 'description' ? '0 0 0 2px #5c6ac433' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            {/* Characteristics */}
            <div style={styles.section}>
              <label style={styles.label}>Характеристики</label>
              <textarea
                value={characteristics}
                onChange={(e) => setCharacteristics(e.target.value)}
                onFocus={() => setFocusedField('characteristics')}
                onBlur={() => setFocusedField(null)}
                onMouseEnter={() => setHoveredField('characteristics')}
                onMouseLeave={() => setHoveredField(null)}
                placeholder="Материал: 100% хлопок&#10;Страна: Турция&#10;Сезон: Лето"
                rows={4}
                style={{
                  ...styles.textarea,
                  borderColor: focusedField === 'characteristics' ? '#5c6ac4' : hoveredField === 'characteristics' ? '#6d7175' : '#919eab',
                  backgroundColor: hoveredField === 'characteristics' && focusedField !== 'characteristics' ? '#fafbfc' : '#fff',
                  boxShadow: focusedField === 'characteristics' ? '0 0 0 2px #5c6ac433' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            {/* Media */}
            <div style={styles.section}>
              <label style={styles.label}>Медиа</label>
              <div style={styles.mediaBox}>
                {images.length === 0 ? (
                  <div style={styles.uploadArea}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={styles.fileInput}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" style={styles.uploadLabel}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#8c9196" style={{ marginBottom: '6px' }}>
                        <path d="M10 0a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V1a1 1 0 011-1z"/>
                      </svg>
                      <span style={styles.uploadText}>Добавьте изображения</span>
                      <span style={styles.uploadHint}>или перетащите сюда</span>
                    </label>
                    <label
                      htmlFor="image-upload"
                      style={{
                        ...styles.addNewBtn,
                        backgroundColor: hoveredField === 'addNew1' ? '#f6f6f7' : '#fff',
                      }}
                      onMouseEnter={() => setHoveredField('addNew1')}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      Добавить новое
                    </label>
                  </div>
                ) : (
                  <div style={styles.imagesContainer}>
                    <div style={styles.imagesGrid}>
                      {images.map((img, index) => (
                        <div key={index} style={styles.imageItem}>
                          <img src={img.preview} alt="" style={styles.imagePreview} />
                          <button type="button" onClick={() => removeImage(index)} style={styles.removeBtn}>×</button>
                        </div>
                      ))}
                      <label
                        htmlFor="add-more"
                        style={{
                          ...styles.addMoreBtn,
                          backgroundColor: hoveredField === 'addMore' ? '#f6f6f7' : '#fff',
                        }}
                        onMouseEnter={() => setHoveredField('addMore')}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={styles.fileInput} id="add-more" />
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#5c5f62">
                          <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                        </svg>
                      </label>
                    </div>
                    <label
                      htmlFor="add-more"
                      style={{
                        ...styles.addNewBtn,
                        backgroundColor: hoveredField === 'addNew2' ? '#f6f6f7' : '#fff',
                      }}
                      onMouseEnter={() => setHoveredField('addNew2')}
                      onMouseLeave={() => setHoveredField(null)}
                    >
                      Добавить новое
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div style={{...styles.section, marginBottom: 0}}>
              <label style={styles.label}>Категория</label>
              <div style={styles.categoryWrapper}>
                <div
                  style={{
                    ...styles.categoryBtn,
                    backgroundColor: hoveredField === 'category' ? '#f6f6f7' : '#fff',
                  }}
                  onClick={() => categoryOpen ? setCategoryOpen(false) : openCategoryDropdown()}
                  onMouseEnter={() => setHoveredField('category')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <span style={selectedCategory ? styles.categorySelected : styles.selectPlaceholder}>
                    {selectedCategory ? selectedCategory.name : 'Выберите категорию'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                    <path d="M10 14l-4-4h8l-4 4z"/>
                  </svg>
                </div>
                {categoryOpen && (
                  <div style={styles.categoryDropdown}>
                    {/* Search input */}
                    <div style={styles.categorySearchWrapper}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="#8c9196" style={styles.categorySearchIcon}>
                        <path d="M8 12a4 4 0 110-8 4 4 0 010 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0014 8 6 6 0 102 8a6 6 0 006 6 5.968 5.968 0 003.473-1.113l4.82 4.82a1 1 0 001.414-1.414z"/>
                      </svg>
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Поиск категории..."
                        style={styles.categorySearchInput}
                        autoFocus
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch('')}
                          style={styles.categorySearchClear}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Show search results or normal navigation */}
                    {(() => {
                      const filteredCats = getFilteredCategories();

                      if (filteredCats !== null) {
                        // Search mode - show filtered results
                        return (
                          <div style={styles.categoryList}>
                            {filteredCats.length > 0 ? (
                              filteredCats.map(cat => {
                                const hasChildren = hasSubcategories(cat);
                                return (
                                  <div
                                    key={cat.id}
                                    style={{
                                      ...styles.categoryItem,
                                      backgroundColor: hoveredField === `cat-${cat.id}` ? '#f1f1f1' : 'transparent',
                                    }}
                                    onClick={() => handleSearchCategorySelect(cat)}
                                    onMouseEnter={() => setHoveredField(`cat-${cat.id}`)}
                                    onMouseLeave={() => setHoveredField(null)}
                                  >
                                    <div style={styles.categoryItemContent}>
                                      <span style={styles.categoryItemName}>{cat.name}</span>
                                      {cat.fullPath !== cat.name && (
                                        <span style={styles.categoryItemPath}>{cat.fullPath}</span>
                                      )}
                                    </div>
                                    {hasChildren && (
                                      <svg width="12" height="12" viewBox="0 0 20 20" fill="#8c9196">
                                        <path d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"/>
                                      </svg>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={styles.categoryEmpty}>Ничего не найдено</div>
                            )}
                          </div>
                        );
                      }

                      // Normal navigation mode
                      return (
                        <>
                          {/* Header with breadcrumbs */}
                          {categoryPath.length > 0 && (
                            <div style={styles.categoryHeader}>
                              <div
                                style={styles.categoryBackBtn}
                                onClick={handleCategoryBack}
                                onMouseEnter={() => setHoveredField('catBack')}
                                onMouseLeave={() => setHoveredField(null)}
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="#5c5f62">
                                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                                </svg>
                              </div>
                              <div style={styles.categoryBreadcrumbs}>
                                {/* Grandparents in gray, smaller */}
                                {categoryPath.length > 1 && (
                                  <div style={styles.categoryAncestors}>
                                    {categoryPath.slice(0, -1).map((cat, idx) => (
                                      <span key={cat.id}>
                                        {idx > 0 && <span style={styles.categoryArrow}> › </span>}
                                        <span>{cat.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Current parent in black, larger */}
                                <div style={styles.categoryCurrentParent}>
                                  {categoryPath[categoryPath.length - 1].name}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Category list */}
                          <div style={styles.categoryList}>
                            {currentCategories.map(cat => {
                              const hasChildren = hasSubcategories(cat);
                              return (
                                <div
                                  key={cat.id}
                                  style={{
                                    ...styles.categoryItem,
                                    backgroundColor: hoveredField === `cat-${cat.id}` ? '#f1f1f1' : 'transparent',
                                  }}
                                  onClick={() => handleCategoryClick(cat)}
                                  onMouseEnter={() => setHoveredField(`cat-${cat.id}`)}
                                  onMouseLeave={() => setHoveredField(null)}
                                >
                                  <span>{cat.name}</span>
                                  {hasChildren && (
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                                      <path d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"/>
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                            {currentCategories.length === 0 && (
                              <div style={styles.categoryEmpty}>Нет категорий</div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Card */}
          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.shippingHeader}>
              <span style={styles.label}>Доставка</span>
              <div style={styles.toggleRow}>
                <span style={styles.shippingToggleLabel}>Физический товар</span>
                <div
                  style={{
                    ...styles.toggle,
                    backgroundColor: isPhysicalProduct ? '#303030' : '#c9cccf',
                  }}
                  onClick={() => setIsPhysicalProduct(!isPhysicalProduct)}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: isPhysicalProduct ? 'translateX(14px)' : 'translateX(2px)',
                  }} />
                </div>
              </div>
            </div>

            {isPhysicalProduct && (
              <>
                <div style={styles.shippingRow}>
                  {/* Package */}
                  <div style={styles.shippingField}>
                    <label style={styles.priceLabel}>Упаковка</label>
                    <div style={styles.selectWrapper}>
                      <div
                        style={{
                          ...styles.packageBtn,
                          backgroundColor: hoveredField === 'package' ? '#f6f6f7' : '#fff',
                        }}
                        onClick={() => setPackageOpen(!packageOpen)}
                        onMouseEnter={() => setHoveredField('package')}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        <div style={styles.packageBtnContent}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="#5c5f62" style={{marginRight: '6px'}}>
                            <path d="M4 4h12v12H4V4zm1 1v10h10V5H5z"/>
                          </svg>
                          <span style={styles.packageText}>
                            {packages.find(p => p.id === selectedPackage)?.name} • {packages.find(p => p.id === selectedPackage)?.size}
                          </span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                          <path d="M10 14l-4-4h8l-4 4z"/>
                        </svg>
                      </div>
                      {packageOpen && (
                        <div style={styles.dropdown}>
                          {packages.map(pkg => (
                            <div
                              key={pkg.id}
                              style={{
                                ...styles.dropdownItem,
                                backgroundColor: hoveredField === `pkg-${pkg.id}` ? '#f1f1f1' : selectedPackage === pkg.id ? '#f4f6f8' : 'transparent'
                              }}
                              onClick={() => { setSelectedPackage(pkg.id); setPackageOpen(false); }}
                              onMouseEnter={() => setHoveredField(`pkg-${pkg.id}`)}
                              onMouseLeave={() => setHoveredField(null)}
                            >
                              <span>{pkg.name}</span>
                              <span style={{fontSize: '11px', color: '#6d7175', marginLeft: '8px'}}>{pkg.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  <div style={styles.shippingFieldSmall}>
                    <label style={styles.priceLabel}>Вес товара</label>
                    <div style={styles.weightInputRow}>
                      <input
                        type="number"
                        value={productWeight}
                        onChange={(e) => setProductWeight(e.target.value)}
                        onFocus={() => setFocusedField('productWeight')}
                        onBlur={() => setFocusedField(null)}
                        onMouseEnter={() => setHoveredField('productWeight')}
                        onMouseLeave={() => setHoveredField(null)}
                        placeholder="0.0"
                        style={{
                          ...styles.weightInput,
                          borderColor: focusedField === 'productWeight' ? '#5c6ac4' : hoveredField === 'productWeight' ? '#6d7175' : '#c9cccf',
                          backgroundColor: hoveredField === 'productWeight' && focusedField !== 'productWeight' ? '#fafbfc' : '#fff',
                        }}
                      />
                      <div style={styles.selectWrapper}>
                        <div
                          style={{
                            ...styles.weightUnitBtn,
                            backgroundColor: hoveredField === 'weightUnit' ? '#f6f6f7' : '#fff',
                          }}
                          onClick={() => setWeightUnitOpen(!weightUnitOpen)}
                          onMouseEnter={() => setHoveredField('weightUnit')}
                          onMouseLeave={() => setHoveredField(null)}
                        >
                          <span>{weightUnit}</span>
                          <svg width="10" height="10" viewBox="0 0 20 20" fill="#5c5f62">
                            <path d="M10 14l-4-4h8l-4 4z"/>
                          </svg>
                        </div>
                        {weightUnitOpen && (
                          <div style={{...styles.dropdown, minWidth: '60px'}}>
                            {weightUnits.map(wu => (
                              <div
                                key={wu}
                                style={{
                                  ...styles.dropdownItem,
                                  backgroundColor: hoveredField === `wu-${wu}` ? '#f1f1f1' : weightUnit === wu ? '#f4f6f8' : 'transparent'
                                }}
                                onClick={() => { setWeightUnit(wu); setWeightUnitOpen(false); }}
                                onMouseEnter={() => setHoveredField(`wu-${wu}`)}
                                onMouseLeave={() => setHoveredField(null)}
                              >
                                {wu}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Variants Card */}
          <div style={{...styles.card, marginTop: '16px'}}>
            <div style={styles.variantsHeader}>
              <span style={styles.label}>Варианты</span>
            </div>

            {!showVariantForm && variants.length === 0 ? (
              <div
                style={{
                  ...styles.addVariantRow,
                  backgroundColor: hoveredField === 'addVariant' ? '#f9fafb' : 'transparent',
                }}
                onClick={() => setShowVariantForm(true)}
                onMouseEnter={() => setHoveredField('addVariant')}
                onMouseLeave={() => setHoveredField(null)}
              >
                <div style={styles.addVariantIcon}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                  </svg>
                </div>
                <span style={styles.addVariantText}>Добавить опции, например размер или цвет</span>
              </div>
            ) : !showVariantForm && variants.length > 0 ? (
              /* Show saved variants */
              <div>
                {variants.map((variant, idx) => (
                  <div key={idx} style={styles.savedVariant}>
                    <span style={styles.savedVariantName}>{variant.name}:</span>
                    <div style={styles.savedVariantValues}>
                      {variant.colors ? (
                        variant.colors.map((c, i) => (
                          <span key={i} style={{...styles.savedVariantTag, backgroundColor: c.hex, color: c.hex === '#fafafa' || c.hex === '#ffee58' ? '#202223' : '#fff'}}>{c.name}</span>
                        ))
                      ) : (
                        variant.values.map((v, i) => (
                          <span key={i} style={styles.savedVariantTag}>{v}</span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    ...styles.addVariantRow,
                    marginTop: '8px',
                    backgroundColor: hoveredField === 'editVariants' ? '#f9fafb' : 'transparent',
                  }}
                  onClick={() => {
                    setVariantOptions(variants.filter(v => !v.colors).map(v => ({ name: v.name, values: v.values })));
                    setSelectedColors(variants.find(v => v.colors)?.colors || []);
                    setShowVariantForm(true);
                  }}
                  onMouseEnter={() => setHoveredField('editVariants')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <div style={styles.addVariantIcon}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                    </svg>
                  </div>
                  <span style={styles.addVariantText}>Редактировать варианты</span>
                </div>
              </div>
            ) : (
              /* Variant form */
              <div style={styles.variantForm}>
                {variantOptions.map((option, optionIndex) => (
                  <div key={optionIndex} style={styles.optionBlock}>
                    <div style={styles.optionRow}>
                      <div style={styles.dragHandle}>
                        <svg width="8" height="14" viewBox="0 0 8 14" fill="#8c9196">
                          <circle cx="2" cy="2" r="1.5"/>
                          <circle cx="6" cy="2" r="1.5"/>
                          <circle cx="2" cy="7" r="1.5"/>
                          <circle cx="6" cy="7" r="1.5"/>
                          <circle cx="2" cy="12" r="1.5"/>
                          <circle cx="6" cy="12" r="1.5"/>
                        </svg>
                      </div>
                      <div style={styles.optionFields}>
                        <label style={styles.optionLabel}>Название опции</label>
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                          onFocus={() => setFocusedField(`optName-${optionIndex}`)}
                          onBlur={() => setFocusedField(null)}
                          onMouseEnter={() => setHoveredField(`optName-${optionIndex}`)}
                          onMouseLeave={() => setHoveredField(null)}
                          placeholder="Размер"
                          style={{
                            ...styles.optionInput,
                            borderColor: focusedField === `optName-${optionIndex}` ? '#5c6ac4' : hoveredField === `optName-${optionIndex}` ? '#6d7175' : '#c9cccf',
                            backgroundColor: hoveredField === `optName-${optionIndex}` && focusedField !== `optName-${optionIndex}` ? '#fafbfc' : '#fff',
                          }}
                        />

                        <label style={{...styles.optionLabel, marginTop: '12px'}}>Значения опции</label>
                        {option.values.map((value, valueIndex) => (
                          <div key={valueIndex} style={styles.valueRow}>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateOptionValue(optionIndex, valueIndex, e.target.value)}
                              onFocus={() => setFocusedField(`optVal-${optionIndex}-${valueIndex}`)}
                              onBlur={() => setFocusedField(null)}
                              onMouseEnter={() => setHoveredField(`optVal-${optionIndex}-${valueIndex}`)}
                              onMouseLeave={() => setHoveredField(null)}
                              placeholder={valueIndex === 0 ? "S, M, L..." : ""}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && value) {
                                  e.preventDefault();
                                  addOptionValue(optionIndex);
                                }
                              }}
                              style={{
                                ...styles.optionInput,
                                borderColor: focusedField === `optVal-${optionIndex}-${valueIndex}` ? '#5c6ac4' : hoveredField === `optVal-${optionIndex}-${valueIndex}` ? '#6d7175' : '#c9cccf',
                                backgroundColor: hoveredField === `optVal-${optionIndex}-${valueIndex}` && focusedField !== `optVal-${optionIndex}-${valueIndex}` ? '#fafbfc' : '#fff',
                              }}
                            />
                            {option.values.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOptionValue(optionIndex, valueIndex)}
                                style={styles.removeValueBtn}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOptionValue(optionIndex)}
                          style={{
                            ...styles.addValueBtn,
                            color: hoveredField === `addVal-${optionIndex}` ? '#202223' : '#5c5f62',
                          }}
                          onMouseEnter={() => setHoveredField(`addVal-${optionIndex}`)}
                          onMouseLeave={() => setHoveredField(null)}
                        >
                          + Добавить значение
                        </button>

                        <div style={styles.optionActions}>
                          <button
                            type="button"
                            onClick={() => removeVariantOption(optionIndex)}
                            style={{
                              ...styles.deleteBtn,
                              backgroundColor: hoveredField === `delOpt-${optionIndex}` ? '#f6f6f7' : '#fff',
                            }}
                            onMouseEnter={() => setHoveredField(`delOpt-${optionIndex}`)}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            Удалить
                          </button>
                          <button
                            type="button"
                            onClick={saveVariants}
                            style={{
                              ...styles.doneBtn,
                              backgroundColor: hoveredField === 'doneBtn' ? '#1a1a1a' : '#303030',
                            }}
                            onMouseEnter={() => setHoveredField('doneBtn')}
                            onMouseLeave={() => setHoveredField(null)}
                          >
                            Готово
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add colors section */}
                <div style={styles.colorSection}>
                  <div
                    style={{
                      ...styles.addColorBtn,
                      backgroundColor: hoveredField === 'addColors' ? '#f6f6f7' : '#fff',
                    }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    onMouseEnter={() => setHoveredField('addColors')}
                    onMouseLeave={() => setHoveredField(null)}
                  >
                    <div style={styles.colorCircles}>
                      <span style={{...styles.colorDot, backgroundColor: '#e53935'}}></span>
                      <span style={{...styles.colorDot, backgroundColor: '#1e88e5', marginLeft: '-4px'}}></span>
                      <span style={{...styles.colorDot, backgroundColor: '#66bb6a', marginLeft: '-4px'}}></span>
                    </div>
                    <span>Добавить цвета</span>
                    {selectedColors.length > 0 && (
                      <span style={styles.colorCount}>({selectedColors.length})</span>
                    )}
                  </div>

                  {showColorPicker && (
                    <div style={styles.colorPicker}>
                      {availableColors.map(color => (
                        <div
                          key={color.hex}
                          style={{
                            ...styles.colorOption,
                            backgroundColor: color.hex,
                            border: selectedColors.find(c => c.hex === color.hex) ? '2px solid #303030' : '1px solid #c9cccf',
                            boxShadow: selectedColors.find(c => c.hex === color.hex) ? '0 0 0 2px #fff inset' : 'none',
                          }}
                          onClick={() => toggleColor(color)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}

                  {selectedColors.length > 0 && (
                    <div style={styles.selectedColorsRow}>
                      {selectedColors.map(color => (
                        <span
                          key={color.hex}
                          style={{
                            ...styles.selectedColorTag,
                            backgroundColor: color.hex,
                            color: color.hex === '#fafafa' || color.hex === '#ffee58' ? '#202223' : '#fff',
                          }}
                        >
                          {color.name}
                          <button
                            type="button"
                            onClick={() => toggleColor(color)}
                            style={styles.removeColorBtn}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add another option */}
                <div
                  style={{
                    ...styles.addVariantRow,
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e1e3e5',
                    backgroundColor: hoveredField === 'addOption' ? '#f9fafb' : 'transparent',
                  }}
                  onClick={addVariantOption}
                  onMouseEnter={() => setHoveredField('addOption')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <div style={styles.addVariantIcon}>
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                    </svg>
                  </div>
                  <span style={styles.addVariantText}>Добавить другую опцию</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status & Price */}
        <div style={styles.rightColumn}>
          {/* Status Card */}
          <div style={styles.cardSmall}>
            <label style={styles.label}>Статус</label>
            <div style={styles.selectWrapper}>
              <div
                style={{
                  ...styles.statusBtn,
                  backgroundColor: hoveredField === 'status' ? '#f6f6f7' : '#fff',
                }}
                onClick={() => setStatusOpen(!statusOpen)}
                onMouseEnter={() => setHoveredField('status')}
                onMouseLeave={() => setHoveredField(null)}
              >
                <span>{status === 'active' ? 'Активен' : 'Черновик'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                  <path d="M10 14l-4-4h8l-4 4z"/>
                </svg>
              </div>
              {statusOpen && (
                <div style={styles.dropdown}>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: hoveredField === 'dropActive' ? '#f1f1f1' : status === 'active' ? '#f4f6f8' : 'transparent'
                    }}
                    onClick={() => { setStatus('active'); setStatusOpen(false); }}
                    onMouseEnter={() => setHoveredField('dropActive')}
                    onMouseLeave={() => setHoveredField(null)}
                  >
                    Активен
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: hoveredField === 'dropDraft' ? '#f1f1f1' : status === 'draft' ? '#f4f6f8' : 'transparent'
                    }}
                    onClick={() => { setStatus('draft'); setStatusOpen(false); }}
                    onMouseEnter={() => setHoveredField('dropDraft')}
                    onMouseLeave={() => setHoveredField(null)}
                  >
                    Черновик
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price Card */}
          <div style={{...styles.cardSmall, marginTop: '12px'}}>
            <label style={styles.label}>Цена</label>

            {/* Retail Price - always shown */}
            <div style={styles.priceRow}>
              <div style={styles.priceInputWrapper}>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  onFocus={() => setFocusedField('retailPrice')}
                  onBlur={() => setFocusedField(null)}
                  onMouseEnter={() => setHoveredField('retailPrice')}
                  onMouseLeave={() => setHoveredField(null)}
                  placeholder="0"
                  style={{
                    ...styles.priceInput,
                    borderColor: focusedField === 'retailPrice' ? '#5c6ac4' : hoveredField === 'retailPrice' ? '#6d7175' : '#c9cccf',
                    backgroundColor: hoveredField === 'retailPrice' && focusedField !== 'retailPrice' ? '#fafbfc' : '#fff',
                  }}
                />
                <span style={styles.priceCurrency}>₽</span>
              </div>
            </div>

            {/* Unit Selector */}
            <div style={{...styles.priceSection, marginTop: '10px'}}>
              <label style={styles.priceLabel}>За единицу</label>
              <div style={styles.selectWrapper}>
                <div
                  style={{
                    ...styles.unitBtn,
                    backgroundColor: hoveredField === 'unit' ? '#f6f6f7' : '#fff',
                  }}
                  onClick={() => setUnitOpen(!unitOpen)}
                  onMouseEnter={() => setHoveredField('unit')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <span>{unit}</span>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="#5c5f62">
                    <path d="M10 14l-4-4h8l-4 4z"/>
                  </svg>
                </div>
                {unitOpen && (
                  <div style={styles.dropdown}>
                    {units.map(u => (
                      <div
                        key={u}
                        style={{
                          ...styles.dropdownItem,
                          backgroundColor: hoveredField === `unit-${u}` ? '#f1f1f1' : unit === u ? '#f4f6f8' : 'transparent'
                        }}
                        onClick={() => { setUnit(u); setUnitOpen(false); }}
                        onMouseEnter={() => setHoveredField(`unit-${u}`)}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        {u}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Wholesale Toggle & Price */}
            <div style={styles.toggleSection}>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Оптовая цена</span>
                <div
                  style={{
                    ...styles.toggle,
                    backgroundColor: wholesaleEnabled ? '#303030' : '#c9cccf',
                  }}
                  onClick={() => setWholesaleEnabled(!wholesaleEnabled)}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: wholesaleEnabled ? 'translateX(14px)' : 'translateX(2px)',
                  }} />
                </div>
              </div>
              {wholesaleEnabled && (
                <div style={styles.priceRow}>
                  <div style={styles.priceInputWrapper}>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      onFocus={() => setFocusedField('wholesalePrice')}
                      onBlur={() => setFocusedField(null)}
                      onMouseEnter={() => setHoveredField('wholesalePrice')}
                      onMouseLeave={() => setHoveredField(null)}
                      placeholder="0"
                      style={{
                        ...styles.priceInput,
                        borderColor: focusedField === 'wholesalePrice' ? '#5c6ac4' : hoveredField === 'wholesalePrice' ? '#6d7175' : '#c9cccf',
                        backgroundColor: hoveredField === 'wholesalePrice' && focusedField !== 'wholesalePrice' ? '#fafbfc' : '#fff',
                      }}
                    />
                    <span style={styles.priceCurrency}>₽</span>
                  </div>
                </div>
              )}
            </div>

            {/* Discount Toggle & Price */}
            <div style={styles.toggleSection}>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Цена со скидкой</span>
                <div
                  style={{
                    ...styles.toggle,
                    backgroundColor: discountEnabled ? '#303030' : '#c9cccf',
                  }}
                  onClick={() => setDiscountEnabled(!discountEnabled)}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: discountEnabled ? 'translateX(14px)' : 'translateX(2px)',
                  }} />
                </div>
              </div>
              {discountEnabled && (
                <div style={styles.priceRow}>
                  <div style={styles.priceInputWrapper}>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      onFocus={() => setFocusedField('discountPrice')}
                      onBlur={() => setFocusedField(null)}
                      onMouseEnter={() => setHoveredField('discountPrice')}
                      onMouseLeave={() => setHoveredField(null)}
                      placeholder="0"
                      style={{
                        ...styles.priceInput,
                        borderColor: focusedField === 'discountPrice' ? '#5c6ac4' : hoveredField === 'discountPrice' ? '#6d7175' : '#c9cccf',
                        backgroundColor: hoveredField === 'discountPrice' && focusedField !== 'discountPrice' ? '#fafbfc' : '#fff',
                      }}
                    />
                    <span style={styles.priceCurrency}>₽</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Card */}
          <div style={{...styles.cardSmall, marginTop: '12px'}}>
            <label style={styles.label}>Склад</label>

            {/* Track Inventory Toggle */}
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Отслеживать остатки</span>
              <div
                style={{
                  ...styles.toggle,
                  backgroundColor: trackInventory ? '#303030' : '#c9cccf',
                }}
                onClick={() => setTrackInventory(!trackInventory)}
              >
                <div style={{
                  ...styles.toggleKnob,
                  transform: trackInventory ? 'translateX(14px)' : 'translateX(2px)',
                }} />
              </div>
            </div>

            {trackInventory ? (
              /* Stock Quantity - when tracking is ON */
              <div style={{marginTop: '12px'}}>
                <label style={styles.priceLabel}>Количество на складе</label>
                <div style={styles.priceInputWrapper}>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    onFocus={() => setFocusedField('stockQuantity')}
                    onBlur={() => setFocusedField(null)}
                    onMouseEnter={() => setHoveredField('stockQuantity')}
                    onMouseLeave={() => setHoveredField(null)}
                    placeholder="0"
                    style={{
                      ...styles.priceInput,
                      padding: '6px 10px',
                      borderColor: focusedField === 'stockQuantity' ? '#5c6ac4' : hoveredField === 'stockQuantity' ? '#6d7175' : '#c9cccf',
                      backgroundColor: hoveredField === 'stockQuantity' && focusedField !== 'stockQuantity' ? '#fafbfc' : '#fff',
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Max Order Quantity - when tracking is OFF */
              <div style={{marginTop: '12px'}}>
                <label style={styles.priceLabel}>Макс. количество в заказе</label>
                <div style={styles.priceInputWrapper}>
                  <input
                    type="number"
                    value={maxOrderQuantity}
                    onChange={(e) => setMaxOrderQuantity(e.target.value)}
                    onFocus={() => setFocusedField('maxOrderQuantity')}
                    onBlur={() => setFocusedField(null)}
                    onMouseEnter={() => setHoveredField('maxOrderQuantity')}
                    onMouseLeave={() => setHoveredField(null)}
                    placeholder="Без ограничений"
                    style={{
                      ...styles.priceInput,
                      padding: '6px 10px',
                      borderColor: focusedField === 'maxOrderQuantity' ? '#5c6ac4' : hoveredField === 'maxOrderQuantity' ? '#6d7175' : '#c9cccf',
                      backgroundColor: hoveredField === 'maxOrderQuantity' && focusedField !== 'maxOrderQuantity' ? '#fafbfc' : '#fff',
                    }}
                  />
                </div>
                <span style={styles.inventoryHint}>Товар будет находиться по заказу</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorBar}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="#d72c0d" style={{ marginRight: '8px' }}>
            <path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Bottom Actions */}
      <div style={styles.bottomBar}>
        <button
          type="button"
          style={{
            ...styles.cancelBtn,
            backgroundColor: hoveredField === 'cancel' ? '#f6f6f7' : '#fff',
          }}
          onClick={() => navigate('/products')}
          onMouseEnter={() => setHoveredField('cancel')}
          onMouseLeave={() => setHoveredField(null)}
          disabled={saving}
        >
          Отменить
        </button>
        <button
          type="button"
          style={{
            ...styles.draftBtn,
            backgroundColor: hoveredField === 'draft' ? '#f6f6f7' : '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onClick={() => handleSave(true)}
          onMouseEnter={() => setHoveredField('draft')}
          onMouseLeave={() => setHoveredField(null)}
          disabled={saving}
        >
          Сохранить как черновик
        </button>
        <button
          type="button"
          style={{
            ...styles.saveBtn,
            backgroundColor: saving ? '#6d7175' : hoveredField === 'save' ? '#1a1a1a' : '#303030',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onClick={() => handleSave(false)}
          onMouseEnter={() => setHoveredField('save')}
          onMouseLeave={() => setHoveredField(null)}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '12px 16px',
  },

  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  breadcrumbLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  breadcrumbText: {
    fontSize: '13px',
    color: '#5c5f62',
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    fontSize: '13px',
    color: '#202223',
    fontWeight: '600',
  },

  content: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: '40px',
  },

  leftColumn: {
    flex: 1,
    maxWidth: '600px',
  },

  rightColumn: {
    width: '240px',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #c9cccf',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
    padding: '16px',
    overflow: 'visible',
  },

  cardSmall: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #c9cccf',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
    padding: '12px',
    position: 'relative',
  },

  section: {
    marginBottom: '16px',
    overflow: 'visible',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
    marginBottom: '4px',
  },

  input: {
    width: '100%',
    padding: '7px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #919eab',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
  },

  textarea: {
    width: '100%',
    padding: '7px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #919eab',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  mediaBox: {
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    overflow: 'hidden',
  },

  uploadArea: {
    position: 'relative',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#fafbfc',
  },

  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },

  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },

  uploadText: {
    fontSize: '13px',
    color: '#2c6ecb',
    fontWeight: '500',
  },

  uploadHint: {
    fontSize: '12px',
    color: '#6d7175',
    marginTop: '2px',
  },

  imagesContainer: {
    padding: '12px',
    backgroundColor: '#fafbfc',
  },

  imagesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },

  imageItem: {
    position: 'relative',
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #c9cccf',
  },

  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  removeBtn: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '18px',
    height: '18px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },

  addMoreBtn: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    border: '1px dashed #c9cccf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#fff',
    position: 'relative',
    transition: 'background-color 0.15s',
  },

  addNewBtn: {
    display: 'inline-block',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
    marginTop: '12px',
    transition: 'background-color 0.15s',
  },

  selectBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    border: '1px solid #919eab',
    borderRadius: '6px',
    cursor: 'not-allowed',
    backgroundColor: '#f6f6f7',
  },

  selectPlaceholder: {
    fontSize: '13px',
    color: '#6d7175',
  },

  categoryWrapper: {
    position: 'relative',
  },

  categoryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'background-color 0.15s',
  },

  categorySelected: {
    fontSize: '13px',
    color: '#202223',
    fontWeight: '500',
  },

  categoryDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    marginTop: '4px',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    borderBottom: '1px solid #e1e3e5',
    backgroundColor: '#fafbfc',
  },

  categoryBackBtn: {
    padding: '2px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
  },

  categoryBreadcrumbs: {
    flex: 1,
  },

  categoryAncestors: {
    fontSize: '11px',
    color: '#6d7175',
    marginBottom: '2px',
  },

  categoryArrow: {
    color: '#8c9196',
  },

  categoryCurrentParent: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#202223',
  },

  categoryList: {
    maxHeight: '250px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#202223',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  categoryEmpty: {
    padding: '12px',
    fontSize: '13px',
    color: '#6d7175',
    textAlign: 'center',
  },

  categorySearchWrapper: {
    position: 'relative',
    padding: '8px 12px',
    borderBottom: '1px solid #e1e3e5',
  },

  categorySearchIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },

  categorySearchInput: {
    width: '100%',
    padding: '7px 30px 7px 28px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  categorySearchClear: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    border: 'none',
    backgroundColor: '#8c9196',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },

  categoryItemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },

  categoryItemName: {
    fontSize: '13px',
    color: '#202223',
  },

  categoryItemPath: {
    fontSize: '11px',
    color: '#6d7175',
  },

  selectWrapper: {
    position: 'relative',
  },

  statusBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'background-color 0.15s',
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    marginTop: '4px',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 10,
  },

  dropdownItem: {
    padding: '8px 10px',
    fontSize: '13px',
    color: '#202223',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  errorBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#fff4f4',
    border: '1px solid #fcd4d4',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#d72c0d',
    marginTop: '16px',
  },

  bottomBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },

  cancelBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
    transition: 'background-color 0.15s',
  },

  saveBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#303030',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'background-color 0.15s',
  },

  draftBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.1)',
    transition: 'background-color 0.15s',
  },

  // Price styles
  priceRow: {
    marginTop: '4px',
  },

  priceInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  priceInput: {
    width: '100%',
    padding: '6px 28px 6px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
  },

  priceCurrency: {
    position: 'absolute',
    right: '10px',
    fontSize: '13px',
    color: '#6d7175',
    pointerEvents: 'none',
  },

  priceSection: {
    marginBottom: '8px',
  },

  priceLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6d7175',
    marginBottom: '4px',
  },

  unitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'background-color 0.15s',
  },

  toggleSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e1e3e5',
  },

  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  toggleLabel: {
    fontSize: '13px',
    color: '#202223',
  },

  toggle: {
    width: '32px',
    height: '18px',
    borderRadius: '9px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
  },

  toggleKnob: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute',
    top: '2px',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },

  inventoryHint: {
    display: 'block',
    fontSize: '11px',
    color: '#6d7175',
    marginTop: '6px',
  },

  // Shipping styles
  shippingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  shippingToggleLabel: {
    fontSize: '13px',
    color: '#6d7175',
    marginRight: '8px',
  },

  shippingRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },

  shippingField: {
    flex: 1,
  },

  shippingFieldSmall: {
    width: '140px',
  },

  packageBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'background-color 0.15s',
  },

  packageBtnContent: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },

  packageText: {
    fontSize: '12px',
    color: '#202223',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  weightInputRow: {
    display: 'flex',
    gap: '4px',
  },

  weightInput: {
    flex: 1,
    width: '70px',
    padding: '6px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
  },

  weightUnitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.15)',
    transition: 'background-color 0.15s',
    minWidth: '50px',
  },

  // Variants styles
  variantsHeader: {
    marginBottom: '8px',
  },

  addVariantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 0',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.15s',
  },

  addVariantIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '1.5px solid #8c9196',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addVariantText: {
    fontSize: '13px',
    color: '#5c5f62',
  },

  variantForm: {
    padding: '8px 0',
  },

  optionBlock: {
    padding: '12px',
    backgroundColor: '#fafbfc',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #e1e3e5',
  },

  optionRow: {
    display: 'flex',
    gap: '12px',
  },

  dragHandle: {
    cursor: 'grab',
    padding: '4px',
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: '28px',
  },

  optionFields: {
    flex: 1,
  },

  optionLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
    marginBottom: '4px',
  },

  optionInput: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
  },

  valueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },

  removeValueBtn: {
    width: '24px',
    height: '24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#8c9196',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },

  addValueBtn: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: '#5c5f62',
    cursor: 'pointer',
    padding: '4px 0',
    transition: 'color 0.15s',
  },

  optionActions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e1e3e5',
  },

  deleteBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  doneBtn: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#303030',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  colorSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e1e3e5',
  },

  addColorBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#202223',
    backgroundColor: '#fff',
    border: '1px solid #c9cccf',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  colorCircles: {
    display: 'flex',
    alignItems: 'center',
  },

  colorDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
  },

  colorCount: {
    fontSize: '12px',
    color: '#6d7175',
  },

  colorPicker: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fafbfc',
    borderRadius: '6px',
    border: '1px solid #e1e3e5',
  },

  colorOption: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },

  selectedColorsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  },

  selectedColorTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '4px',
  },

  removeColorBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '2px',
    opacity: '0.8',
  },

  savedVariant: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid #e1e3e5',
  },

  savedVariantName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#202223',
  },

  savedVariantValues: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },

  savedVariantTag: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '12px',
    backgroundColor: '#e4e5e7',
    color: '#202223',
    borderRadius: '4px',
  },
};

export default AddProduct;
