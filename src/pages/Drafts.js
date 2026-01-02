import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

function Drafts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/`);
      const data = await res.json();
      let allProducts = [];
      if (Array.isArray(data)) {
        allProducts = data;
      } else if (data.products && Array.isArray(data.products)) {
        allProducts = data.products;
      } else if (data.results && Array.isArray(data.results)) {
        allProducts = data.results;
      }
      // Filter only drafts
      const drafts = allProducts.filter(p => p.status === 'draft');
      setProducts(drafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParentCategory = (product) => {
    if (product.category_full_path) {
      const parts = product.category_full_path.split(' > ');
      return parts[0];
    }
    return product.category_name || '—';
  };

  const getProductImage = (product) => {
    return product.primary_image || null;
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#303030">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
          <h1 style={styles.title}>Черновики</h1>
          <span style={styles.count}>{products.length}</span>
        </div>
        <button
          style={{
            ...styles.btnPrimary,
            backgroundColor: hoveredBtn === 'add' ? '#1a1a1a' : '#303030',
          }}
          onMouseEnter={() => setHoveredBtn('add')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => navigate('/products/add')}
        >
          Добавить товар
        </button>
      </div>

      {/* Card container */}
      <div style={styles.card}>
        {products.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thCheck}>
                  <input type="checkbox" style={styles.checkbox} />
                </th>
                <th style={styles.th}>Товар</th>
                <th style={styles.th}>Остаток</th>
                <th style={styles.th}>Категория</th>
                <th style={styles.th}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => {
                const imageUrl = getProductImage(product);
                return (
                  <tr
                    key={product.id}
                    style={{
                      ...styles.tr,
                      backgroundColor: hoveredRow === idx ? '#f6f6f7' : '#fff',
                    }}
                    onMouseEnter={() => setHoveredRow(idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <td style={styles.tdCheck} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" style={styles.checkbox} />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} style={styles.productImage} />
                        ) : (
                          <div style={styles.imagePlaceholder}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="#8c9196">
                              <path d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zm3.25 3a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm9.75 3.5l-3-3-4.5 4.5-1.5-1.5-4 4V16h12a.5.5 0 00.5-.5v-4.5z"/>
                            </svg>
                          </div>
                        )}
                        <span style={styles.productName}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{
                      ...styles.td,
                      color: (product.stock_quantity || 0) === 0 ? '#d72c0d' : '#303030'
                    }}>
                      {product.stock_quantity || 0} шт
                    </td>
                    <td style={styles.td}>{getParentCategory(product)}</td>
                    <td style={styles.td}>
                      {product.retail_price ? `${Number(product.retail_price).toLocaleString()} ₽` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 20 20" fill="#8c9196" style={{ marginBottom: 12 }}>
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            <p style={styles.emptyTitle}>Нет черновиков</p>
            <p style={styles.emptyText}>Сохраняйте незавершенные товары как черновики</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '16px 20px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e3e3e3',
    borderTopColor: '#333',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#303030',
    margin: 0,
  },
  count: {
    fontSize: '13px',
    color: '#6d7175',
    backgroundColor: '#e4e5e7',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#303030',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
    transition: 'background-color 0.15s',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e1e3e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6d7175',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  thCheck: {
    padding: '8px 12px',
    width: '36px',
    backgroundColor: '#f6f6f7',
    borderBottom: '1px solid #e1e3e5',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '8px 12px',
    fontSize: '13px',
    color: '#303030',
    borderBottom: '1px solid #e1e3e5',
  },
  tdCheck: {
    padding: '8px 12px',
    width: '36px',
    borderBottom: '1px solid #e1e3e5',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },

  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  productImage: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #e1e3e5',
  },
  imagePlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#f1f1f1',
    border: '1px solid #e1e3e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#303030',
  },

  empty: {
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#303030',
    margin: '0 0 4px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6d7175',
    margin: 0,
  },
};

export default Drafts;
