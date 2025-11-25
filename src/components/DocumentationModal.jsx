import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

const DocumentationModal = ({ onClose, userRole }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const docs = [
    {
      id: 'quickstart',
      file: 'QUICK_START.md',
      title: 'Quick Start Guide',
      description: 'Get started in 5 minutes - essential features and workflows',
      icon: '⚡',
      forRoles: ['owner', 'admin', 'user']
    },
    {
      id: 'userguide',
      file: 'USER_GUIDE.md',
      title: 'User Guide',
      description: 'Complete feature reference with detailed instructions (50+ pages)',
      icon: '📖',
      forRoles: ['owner', 'admin', 'user']
    },
    {
      id: 'adminguide',
      file: 'ADMIN_GUIDE.md',
      title: 'Admin Guide',
      description: 'Admin and Owner features - user management, bulk operations, locations',
      icon: '⚙️',
      forRoles: ['owner', 'admin']
    },
    {
      id: 'workflows',
      file: 'WORKFLOWS.md',
      title: 'Workflows',
      description: '13 step-by-step real-world scenarios from setup to post-festival',
      icon: '📋',
      forRoles: ['owner', 'admin', 'user']
    },
    {
      id: 'faq',
      file: 'FAQ.md',
      title: 'FAQ',
      description: '100+ frequently asked questions and troubleshooting tips',
      icon: '❓',
      forRoles: ['owner', 'admin', 'user']
    }
  ];

  // Filter docs by user role
  const availableDocs = docs.filter(doc => doc.forRoles.includes(userRole));

  useEffect(() => {
    if (selectedDoc) {
      setLoading(true);
      fetch(`/docs/${selectedDoc.file}`)
        .then(response => response.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading documentation:', error);
          setContent('# Error Loading Documentation\n\nCould not load the documentation file. Please try again.');
          setLoading(false);
        });
    }
  }, [selectedDoc]);

  const handleBack = () => {
    setSelectedDoc(null);
    setContent('');
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    },
    modal: {
      backgroundColor: '#1e1e1e',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid #ffa500',
      boxShadow: '0 8px 32px rgba(255, 165, 0, 0.3)'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#252525'
    },
    title: {
      margin: 0,
      color: '#ffa500',
      fontSize: '24px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#888',
      fontSize: '28px',
      cursor: 'pointer',
      padding: '0',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s'
    },
    content: {
      padding: '20px',
      overflowY: 'auto',
      flex: 1
    },
    docList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    docCard: {
      backgroundColor: '#2d2d2d',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #444',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      gap: '15px',
      alignItems: 'flex-start'
    },
    docIcon: {
      fontSize: '32px',
      flexShrink: 0
    },
    docInfo: {
      flex: 1
    },
    docTitle: {
      color: '#ffa500',
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '6px'
    },
    docDescription: {
      color: '#aaa',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    markdownContent: {
      color: '#ddd',
      lineHeight: '1.8',
      fontSize: '15px'
    },
    backButton: {
      background: '#ffa500',
      border: 'none',
      color: '#000',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      marginBottom: '20px'
    },
    loading: {
      textAlign: 'center',
      color: '#888',
      padding: '40px',
      fontSize: '16px'
    }
  };

  // Markdown styles
  const markdownStyles = `
    .markdown-content h1 {
      color: #ffa500;
      border-bottom: 2px solid #ffa500;
      padding-bottom: 10px;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 32px;
    }
    .markdown-content h2 {
      color: #ffa500;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 26px;
      border-bottom: 1px solid #444;
      padding-bottom: 8px;
    }
    .markdown-content h3 {
      color: #ffb84d;
      margin-top: 25px;
      margin-bottom: 12px;
      font-size: 22px;
    }
    .markdown-content h4 {
      color: #ffca80;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .markdown-content p {
      margin-bottom: 15px;
      line-height: 1.8;
    }
    .markdown-content ul, .markdown-content ol {
      margin-bottom: 15px;
      padding-left: 30px;
    }
    .markdown-content li {
      margin-bottom: 8px;
    }
    .markdown-content code {
      background: #252525;
      padding: 2px 6px;
      border-radius: 3px;
      color: #ffa500;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .markdown-content pre {
      background: #252525;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 15px;
      border: 1px solid #444;
    }
    .markdown-content pre code {
      background: none;
      padding: 0;
      color: #ddd;
    }
    .markdown-content blockquote {
      border-left: 4px solid #ffa500;
      padding-left: 20px;
      margin-left: 0;
      color: #aaa;
      font-style: italic;
    }
    .markdown-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .markdown-content th {
      background: #252525;
      color: #ffa500;
      padding: 12px;
      text-align: left;
      border: 1px solid #444;
      font-weight: 600;
    }
    .markdown-content td {
      padding: 10px 12px;
      border: 1px solid #444;
    }
    .markdown-content tr:nth-child(even) {
      background: #252525;
    }
    .markdown-content a {
      color: #ffa500;
      text-decoration: none;
    }
    .markdown-content a:hover {
      text-decoration: underline;
    }
    .markdown-content hr {
      border: none;
      border-top: 1px solid #444;
      margin: 30px 0;
    }
    .markdown-content strong {
      color: #fff;
      font-weight: 600;
    }
  `;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{markdownStyles}</style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {selectedDoc ? selectedDoc.icon : '📚'}
            {selectedDoc ? selectedDoc.title : 'Help & Documentation'}
          </h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffa500';
              e.target.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#888';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          {!selectedDoc ? (
            // Documentation list
            <div style={styles.docList}>
              <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '15px' }}>
                Choose a documentation guide to view:
              </p>
              {availableDocs.map(doc => (
                <div
                  key={doc.id}
                  style={styles.docCard}
                  onClick={() => setSelectedDoc(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333';
                    e.currentTarget.style.borderColor = '#ffa500';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d2d';
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={styles.docIcon}>{doc.icon}</div>
                  <div style={styles.docInfo}>
                    <div style={styles.docTitle}>{doc.title}</div>
                    <div style={styles.docDescription}>{doc.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Documentation content
            <div>
              <button
                style={styles.backButton}
                onClick={handleBack}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#ffb84d';
                  e.target.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffa500';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                ← Back to Documentation List
              </button>

              {loading ? (
                <div style={styles.loading}>Loading documentation...</div>
              ) : (
                <div style={styles.markdownContent} className="markdown-content">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
