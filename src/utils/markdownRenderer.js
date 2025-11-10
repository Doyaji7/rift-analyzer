/**
 * Markdown renderer utility with custom styled components
 * for rendering AI chat responses with proper formatting
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Custom components for markdown rendering
 * Styled to match the application theme (gold/dark colors)
 */
const markdownComponents = {
  // Headers
  h1: ({ children }) => (
    <h1 style={{
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#d4af37',
      marginTop: '0.5rem',
      marginBottom: '0.375rem',
      borderBottom: '2px solid #d4af37',
      paddingBottom: '0.25rem'
    }}>
      {children}
    </h1>
  ),
  
  h2: ({ children }) => (
    <h2 style={{
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#d4af37',
      marginTop: '0.5rem',
      marginBottom: '0.375rem'
    }}>
      {children}
    </h2>
  ),
  
  h3: ({ children }) => (
    <h3 style={{
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#e5c07b',
      marginTop: '0.5rem',
      marginBottom: '0.25rem'
    }}>
      {children}
    </h3>
  ),
  
  // Paragraphs
  p: ({ children }) => (
    <p style={{
      marginBottom: '0.5rem',
      lineHeight: '1.5',
      color: '#e6e6e6'
    }}>
      {children}
    </p>
  ),
  
  // Unordered lists
  ul: ({ children }) => (
    <ul style={{
      marginLeft: '1.25rem',
      marginBottom: '0.5rem',
      listStyleType: 'disc',
      color: '#e6e6e6'
    }}>
      {children}
    </ul>
  ),
  
  // Ordered lists
  ol: ({ children }) => (
    <ol style={{
      marginLeft: '1.25rem',
      marginBottom: '0.5rem',
      listStyleType: 'decimal',
      color: '#e6e6e6'
    }}>
      {children}
    </ol>
  ),
  
  // List items
  li: ({ children }) => (
    <li style={{
      marginBottom: '0.25rem',
      lineHeight: '1.4'
    }}>
      {children}
    </li>
  ),
  
  // Code blocks and inline code
  code: ({ inline, children, ...props }) => {
    if (inline) {
      return (
        <code style={{
          backgroundColor: '#2d3748',
          color: '#e5c07b',
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          fontSize: '0.875em',
          fontFamily: 'monospace'
        }} {...props}>
          {children}
        </code>
      );
    }
    
    return (
      <pre style={{
        backgroundColor: '#1a1f2e',
        padding: '1rem',
        borderRadius: '0.375rem',
        overflowX: 'auto',
        marginBottom: '0.75rem',
        border: '1px solid #2d3748'
      }}>
        <code style={{
          color: '#e5c07b',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          lineHeight: '1.5'
        }} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  
  // Strong (bold) text
  strong: ({ children }) => (
    <strong style={{
      fontWeight: 'bold',
      color: '#d4af37'
    }}>
      {children}
    </strong>
  ),
  
  // Emphasis (italic) text
  em: ({ children }) => (
    <em style={{
      fontStyle: 'italic',
      color: '#e5c07b'
    }}>
      {children}
    </em>
  ),
  
  // Links
  a: ({ href, children }) => (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#61afef',
        textDecoration: 'underline',
        cursor: 'pointer',
        transition: 'color 0.2s'
      }}
      onMouseEnter={(e) => e.target.style.color = '#84c5ff'}
      onMouseLeave={(e) => e.target.style.color = '#61afef'}
    >
      {children}
    </a>
  ),
  
  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '4px solid #d4af37',
      paddingLeft: '1rem',
      marginLeft: '0',
      marginBottom: '0.75rem',
      color: '#b8b8b8',
      fontStyle: 'italic'
    }}>
      {children}
    </blockquote>
  ),
  
  // Horizontal rule
  hr: () => (
    <hr style={{
      border: 'none',
      borderTop: '1px solid #2d3748',
      marginTop: '1rem',
      marginBottom: '1rem'
    }} />
  ),
  
  // Tables
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        color: '#e6e6e6'
      }}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children }) => (
    <thead style={{
      backgroundColor: '#2d3748',
      borderBottom: '2px solid #d4af37'
    }}>
      {children}
    </thead>
  ),
  
  tbody: ({ children }) => (
    <tbody>
      {children}
    </tbody>
  ),
  
  tr: ({ children }) => (
    <tr style={{
      borderBottom: '1px solid #2d3748'
    }}>
      {children}
    </tr>
  ),
  
  th: ({ children }) => (
    <th style={{
      padding: '0.75rem',
      textAlign: 'left',
      fontWeight: 'bold',
      color: '#d4af37'
    }}>
      {children}
    </th>
  ),
  
  td: ({ children }) => (
    <td style={{
      padding: '0.75rem',
      textAlign: 'left'
    }}>
      {children}
    </td>
  )
};

/**
 * Render markdown content with custom styling
 * @param {string} content - Markdown content to render
 * @returns {JSX.Element} Rendered markdown with custom components
 */
export const renderMarkdown = (content) => {
  if (!content) {
    return null;
  }
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
};

/**
 * Export custom components for direct use if needed
 */
export { markdownComponents };
