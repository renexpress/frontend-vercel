import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCharacteristics, setEditCharacteristics] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [editAudience, setEditAudience] = useState(null);
  const [editColors, setEditColors] = useState([]);
  const [editSize, setEditSize] = useState(null);

  // Options
  const [categories, setCategories] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchOptions();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}/`);
      setProduct(response.data);
      setEditName(response.data.name);
      setEditDescription(response.data.description || '');
      setEditCharacteristics(response.data.characteristics || '');
      setEditPrice(response.data.price || '');
      setEditCategory(response.data.category);
      setEditAudience(response.data.audience);
      setEditColors(response.data.color_ids || []);
      setEditSize(response.data.size);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [catRes, audRes, colRes, sizeRes] = await Promise.all([
        axios.get(`${API_URL}/categories/`),
        axios.get(`${API_URL}/audiences/`),
        axios.get(`${API_URL}/colors/`),
        axios.get(`${API_URL}/sizes/`),
      ]);
      setCategories(catRes.data);
      setAudiences(audRes.data);
      setColors(colRes.data);
      setSizes(sizeRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/products/${id}/`);
      navigate('/products');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/products/${id}/`, {
        name: editName,
        description: editDescription,
        characteristics: editCharacteristics,
        price: editPrice ? parseFloat(editPrice) : null,
        category: editCategory,
        audience: editAudience,
        color_ids: editColors,
        size: editSize,
      });
      await fetchProduct();
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
    }
    setSaving(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}>
          <div style={styles.loaderRing}></div>
          <div style={styles.loaderRing}></div>
          <div style={styles.loaderRing}></div>
        </div>
        <p style={styles.loadingText}>Загрузка товара...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>!</div>
        <h2>Товар не найден</h2>
        <button style={styles.backBtn} onClick={() => navigate('/products')}>
          Вернуться к товарам
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <span>🗑️</span>
            </div>
            <h3 style={styles.modalTitle}>Удалить товар?</h3>
            <p style={styles.modalText}>
              Вы уверены, что хотите удалить "{product.name}"? Это действие нельзя отменить.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                style={styles.modalDeleteBtn}
                onClick={handleDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/products')}>
          <span style={styles.backArrow}>←</span>
          <span>Назад к товарам</span>
        </button>
        <div style={styles.headerActions}>
          {!isEditing ? (
            <>
              <button
                style={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                <span>✏️</span> Редактировать
              </button>
              <button
                style={styles.deleteButton}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <span>🗑️</span> Удалить
              </button>
            </>
          ) : (
            <>
              <button
                style={styles.cancelEditBtn}
                onClick={() => setIsEditing(false)}
              >
                Отмена
              </button>
              <button
                style={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : '✓ Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Image Gallery */}
        <div style={styles.gallerySection}>
          <div style={styles.mainImageContainer}>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[activeImageIndex]?.image_url}
                alt={product.name}
                style={styles.mainImage}
              />
            ) : (
              <div style={styles.noImagePlaceholder}>
                <div style={styles.noImageIcon}>📷</div>
                <span>Нет изображения</span>
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  style={{...styles.galleryNav, ...styles.galleryNavPrev}}
                  onClick={() => setActiveImageIndex(i => i > 0 ? i - 1 : product.images.length - 1)}
                >
                  ‹
                </button>
                <button
                  style={{...styles.galleryNav, ...styles.galleryNavNext}}
                  onClick={() => setActiveImageIndex(i => i < product.images.length - 1 ? i + 1 : 0)}
                >
                  ›
                </button>
              </>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div style={styles.thumbnails}>
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.thumbnail,
                    ...(idx === activeImageIndex ? styles.thumbnailActive : {})
                  }}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img src={img.image_url} alt="" style={styles.thumbnailImg} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div style={styles.infoSection}>
          {!isEditing ? (
            <>
              {/* View Mode */}
              <div style={styles.productHeader}>
                <h1 style={styles.productName}>{product.name}</h1>
                {product.price && (
                  <div style={styles.priceTag}>
                    <span style={styles.priceValue}>{formatPrice(product.price)}</span>
                  </div>
                )}
              </div>

              <div style={styles.attributesGrid}>
                {product.category_name && (
                  <div style={styles.attributeCard}>
                    <div style={styles.attributeIcon}>📁</div>
                    <div style={styles.attributeContent}>
                      <span style={styles.attributeLabel}>Категория</span>
                      <span style={styles.attributeValue}>{product.category_name}</span>
                    </div>
                  </div>
                )}
                {product.audience_name && (
                  <div style={styles.attributeCard}>
                    <div style={styles.attributeIcon}>👥</div>
                    <div style={styles.attributeContent}>
                      <span style={styles.attributeLabel}>Аудитория</span>
                      <span style={styles.attributeValue}>{product.audience_name}</span>
                    </div>
                  </div>
                )}
                {product.size_name && (
                  <div style={styles.attributeCard}>
                    <div style={styles.attributeIcon}>📏</div>
                    <div style={styles.attributeContent}>
                      <span style={styles.attributeLabel}>Размер</span>
                      <span style={styles.attributeValue}>{product.size_name}</span>
                    </div>
                  </div>
                )}
                {product.colors && product.colors.length > 0 && (
                  <div style={styles.attributeCard}>
                    <div
                      style={{
                        ...styles.attributeIcon,
                        background: `linear-gradient(135deg, ${product.color_hex || '#ccc'}, ${product.color_hex || '#ccc'}88)`
                      }}
                    >
                      <span style={{filter: 'grayscale(1) brightness(10)'}}>●</span>
                    </div>
                    <div style={styles.attributeContent}>
                      <span style={styles.attributeLabel}>Цвет</span>
                      <span style={styles.attributeValue}>{product.colors && product.colors.length > 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {product.description && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionLabel}>Описание</h3>
                  <p style={styles.description}>{product.description}</p>
                </div>
              )}

              {product.characteristics && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.sectionLabel}>Характеристики</h3>
                  <div style={styles.description}>
                    {product.characteristics.split('\n').map((line, idx) => (
                      <p key={idx} style={{ margin: '4px 0' }}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.metaInfo}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>ID товара:</span>
                  <span style={styles.metaValue}>#{product.id}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Создан:</span>
                  <span style={styles.metaValue}>
                    {new Date(product.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div style={styles.editForm}>
                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Название</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={styles.editInput}
                  />
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Цена (руб.)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    style={styles.editInput}
                  />
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Описание</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    style={styles.editTextarea}
                    rows={4}
                  />
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Характеристики</label>
                  <textarea
                    value={editCharacteristics}
                    onChange={e => setEditCharacteristics(e.target.value)}
                    style={styles.editTextarea}
                    rows={6}
                    placeholder="Введите каждую характеристику с новой строки, например:
Серия: NB 530
Код модели: MR530SG
Материал: текстиль, кожа"
                  />
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Категория</label>
                  <div style={styles.optionsWrap}>
                    {categories.map(cat => (
                      <div
                        key={cat.id}
                        style={{
                          ...styles.optionChip,
                          ...(editCategory === cat.id ? styles.optionChipSelected : {})
                        }}
                        onClick={() => setEditCategory(editCategory === cat.id ? null : cat.id)}
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Аудитория</label>
                  <div style={styles.optionsWrap}>
                    {audiences.map(aud => (
                      <div
                        key={aud.id}
                        style={{
                          ...styles.optionChip,
                          ...(editAudience === aud.id ? styles.optionChipSelected : {})
                        }}
                        onClick={() => setEditAudience(editAudience === aud.id ? null : aud.id)}
                      >
                        {aud.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Размер</label>
                  <div style={styles.optionsWrap}>
                    {sizes.map(size => (
                      <div
                        key={size.id}
                        style={{
                          ...styles.optionChip,
                          ...(editSize === size.id ? styles.optionChipSelected : {})
                        }}
                        onClick={() => setEditSize(editSize === size.id ? null : size.id)}
                      >
                        {size.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.editSection}>
                  <label style={styles.editLabel}>Цвет</label>
                  <div style={styles.optionsWrap}>
                    {colors.map(color => (
                      <div
                        key={color.id}
                        style={{
                          ...styles.colorChip,
                          ...(editColors.includes(color.id) ? styles.colorChipSelected : {})
                        }}
                        onClick={() => setEditColors(prev => prev.includes(color.id) ? prev.filter(id => id !== color.id) : [...prev, color.id])}
                      >
                        <span
                          style={{
                            ...styles.colorDot,
                            backgroundColor: color.hex_code || '#ccc'
                          }}
                        />
                        {color.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    animation: 'fadeIn 0.4s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
  },
  loader: {
    position: 'relative',
    width: '60px',
    height: '60px',
  },
  loaderRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '3px solid transparent',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1.2s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#64748b',
    fontSize: '14px',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px',
  },
  errorIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: '#fef2f2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: '#ef4444',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 0',
    transition: 'all 0.2s ease',
  },
  backArrow: {
    fontSize: '18px',
    transition: 'transform 0.2s ease',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cancelEditBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
  },
  gallerySection: {
    position: 'sticky',
    top: '32px',
  },
  mainImageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    aspectRatio: '1',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    gap: '12px',
  },
  noImageIcon: {
    fontSize: '48px',
    opacity: '0.5',
  },
  galleryNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: 'none',
    borderRadius: '50%',
    fontSize: '24px',
    color: '#1e293b',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryNavPrev: {
    left: '16px',
  },
  galleryNavNext: {
    right: '16px',
  },
  thumbnails: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '72px',
    height: '72px',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '3px solid transparent',
    transition: 'all 0.2s ease',
    opacity: '0.6',
  },
  thumbnailActive: {
    borderColor: '#6366f1',
    opacity: '1',
    transform: 'scale(1.05)',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  infoSection: {
    padding: '8px 0',
  },
  productHeader: {
    marginBottom: '32px',
  },
  productName: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 16px 0',
    lineHeight: '1.2',
  },
  priceTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
  },
  priceValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
  },
  attributesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  attributeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
  },
  attributeIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  attributeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  attributeLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  attributeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  descriptionSection: {
    marginBottom: '32px',
  },
  sectionLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  description: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.8',
    margin: 0,
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  metaInfo: {
    display: 'flex',
    gap: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
  },
  metaItem: {
    display: 'flex',
    gap: '8px',
  },
  metaLabel: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  metaValue: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  // Edit form styles
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  editLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  editInput: {
    padding: '14px 18px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#1e293b',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  editTextarea: {
    padding: '14px 18px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#1e293b',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  optionsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  optionChip: {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  optionChipSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
    color: '#6366f1',
  },
  colorChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  colorChipSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  colorDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.1)',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    animation: 'slideUp 0.3s ease',
  },
  modalIcon: {
    width: '72px',
    height: '72px',
    backgroundColor: '#fef2f2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '32px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  modalText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '12px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalDeleteBtn: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  backBtn: {
    padding: '12px 24px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default ProductDetail;
