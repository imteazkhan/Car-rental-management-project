import React, { useState, useEffect, useMemo } from 'react';
import './DataTable.css';

const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  error = null,
  onAdd = null,
  onEdit = null,
  onDelete = null,
  onBulkAction = null,
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = false,
  actionButtons = [],
  pagination = null,
  onPageChange = null,
  className = '',
  title = '',
  refreshAction = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm && searchable) {
      filtered = filtered.filter(row => 
        columns.some(column => {
          const value = row[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply basic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(row => {
          const rowValue = row[key];
          return rowValue && rowValue.toString().toLowerCase() === value.toLowerCase();
        });
      }
    });

    // Apply advanced filters
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        const column = columns.find(col => col.key === key);
        if (column) {
          if (column.type === 'number' || column.type === 'currency') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              filtered = filtered.filter(row => {
                const rowValue = Number(row[key] || 0);
                return rowValue >= numValue;
              });
            }
          } else if (column.type === 'date') {
            filtered = filtered.filter(row => {
              const rowDate = new Date(row[key]);
              const filterDate = new Date(value);
              return rowDate >= filterDate;
            });
          } else {
            filtered = filtered.filter(row => {
              const rowValue = row[key];
              return rowValue && rowValue.toString().toLowerCase().includes(value.toLowerCase());
            });
          }
        }
      }
    });

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      const dateColumns = columns.filter(col => col.type === 'date');
      if (dateColumns.length > 0) {
        const dateColumn = dateColumns[0]; // Use first date column
        filtered = filtered.filter(row => {
          const rowDate = new Date(row[dateColumn.key]);
          let valid = true;
          
          if (dateRange.start) {
            valid = valid && rowDate >= new Date(dateRange.start);
          }
          
          if (dateRange.end) {
            valid = valid && rowDate <= new Date(dateRange.end);
          }
          
          return valid;
        });
      }
    }

    return filtered;
  }, [data, searchTerm, filters, advancedFilters, dateRange, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Handle sort
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Handle row selection
  const handleSelectRow = (id) => {
    if (!selectable) return;
    
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!selectable) return;
    
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map(row => row.id)));
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle advanced filter change
  const handleAdvancedFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setAdvancedFilters({});
    setDateRange({ start: '', end: '' });
    setSearchTerm('');
  };

  // Handle bulk action
  const handleBulkAction = (action) => {
    if (onBulkAction && selectedRows.size > 0) {
      onBulkAction(action, Array.from(selectedRows));
      setSelectedRows(new Set());
      setShowBulkActions(false);
    }
  };

  // Get unique values for filter options
  const getFilterOptions = (key) => {
    const uniqueValues = [...new Set(data.map(row => row[key]).filter(Boolean))];
    return uniqueValues.sort();
  };

  // Render cell content
  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }

    if (column.type === 'boolean') {
      return row[column.key] ? 
        <span className="status-badge status-active">Yes</span> : 
        <span className="status-badge status-inactive">No</span>;
    }

    if (column.type === 'status') {
      const status = row[column.key];
      return <span className={`status-badge status-${status}`}>{status}</span>;
    }

    if (column.type === 'currency') {
      return `$${Number(row[column.key] || 0).toLocaleString()}`;
    }

    if (column.type === 'date') {
      return new Date(row[column.key]).toLocaleDateString();
    }

    return row[column.key] || '-';
  };

  useEffect(() => {
    setShowBulkActions(selectedRows.size > 0);
  }, [selectedRows]);

  if (error) {
    return (
      <div className="data-table-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        {refreshAction && (
          <button onClick={refreshAction} className="btn btn-primary">
            <i className="fas fa-refresh"></i>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      {/* Header */}
      <div className="data-table-header">
        <div className="data-table-title-section">
          <h2 className="data-table-title">{title}</h2>
          {refreshAction && (
            <button 
              onClick={refreshAction}
              className="btn btn-ghost btn-sm"
              disabled={loading}
            >
              <i className={`fas fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          )}
        </div>

        <div className="data-table-actions">
          {searchable && (
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {onAdd && (
            <button onClick={onAdd} className="btn btn-primary">
              <i className="fas fa-plus"></i>
              Add New
            </button>
          )}

          {filterable && (
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn btn-outline ${showAdvancedFilters ? 'active' : ''}`}
            >
              <i className="fas fa-filter"></i>
              Advanced Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {filterable && (
        <div className="data-table-filters">
          {columns
            .filter(col => col.filterable)
            .map(column => (
              <select
                key={column.key}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                value={filters[column.key] || 'all'}
                className="filter-select"
              >
                <option value="all">All {column.label}</option>
                {getFilterOptions(column.key).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && filterable && (
        <div className="advanced-filters">
          <div className="advanced-filters-header">
            <h3>Advanced Filters</h3>
            <button 
              onClick={clearAllFilters}
              className="btn btn-ghost btn-sm"
            >
              <i className="fas fa-times"></i>
              Clear All
            </button>
          </div>
          
          <div className="advanced-filters-grid">
            {/* Date Range Filter */}
            {columns.some(col => col.type === 'date') && (
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range-inputs">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="filter-input"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}

            {/* Column-specific advanced filters */}
            {columns
              .filter(col => col.advancedFilter !== false && !col.filterable)
              .map(column => (
                <div key={column.key} className="filter-group">
                  <label>{column.label}</label>
                  {column.type === 'number' || column.type === 'currency' ? (
                    <input
                      type="number"
                      placeholder={`Min ${column.label}`}
                      value={advancedFilters[column.key] || ''}
                      onChange={(e) => handleAdvancedFilterChange(column.key, e.target.value)}
                      className="filter-input"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`Search ${column.label}...`}
                      value={advancedFilters[column.key] || ''}
                      onChange={(e) => handleAdvancedFilterChange(column.key, e.target.value)}
                      className="filter-input"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && onBulkAction && (
        <div className="bulk-actions-bar">
          <span className="bulk-selected">
            {selectedRows.size} item(s) selected
          </span>
          <div className="bulk-actions">
            {actionButtons.map((action, index) => (
              <button
                key={index}
                onClick={() => handleBulkAction(action.action)}
                className={`btn btn-sm ${action.variant || 'btn-secondary'}`}
              >
                <i className={action.icon}></i>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                    onChange={handleSelectAll}
                    className="table-checkbox"
                  />
                </th>
              )}
              {columns.map(column => (
                <th 
                  key={column.key} 
                  className={`${column.sortable !== false && sortable ? 'sortable' : ''} ${column.className || ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="th-content">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortable && sortConfig.key === column.key && (
                      <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || actionButtons.length > 0) && (
                <th className="actions-column">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + ((onEdit || onDelete) ? 1 : 0)}>
                  <div className="table-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + ((onEdit || onDelete) ? 1 : 0)}>
                  <div className="table-empty">
                    <i className="fas fa-inbox"></i>
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={row.id || index} className={selectedRows.has(row.id) ? 'selected' : ''}>
                  {selectable && (
                    <td className="select-column">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="table-checkbox"
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key} className={column.className || ''}>
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {(onEdit || onDelete || actionButtons.length > 0) && (
                    <td className="actions-column">
                      <div className="action-buttons">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="btn btn-ghost btn-sm"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="btn btn-ghost btn-sm btn-danger"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                        {actionButtons.filter(btn => btn.condition ? btn.condition(row) : true).map((action, index) => (
                          <button
                            key={index}
                            onClick={() => action.onClick(row)}
                            className={`btn btn-ghost btn-sm ${action.variant || ''}`}
                            title={action.label}
                          >
                            <i className={action.icon}></i>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="btn btn-ghost btn-sm"
            >
              <i className="fas fa-chevron-left"></i>
              Previous
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const page = i + Math.max(1, pagination.current_page - 2);
                return page <= pagination.total_pages ? (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`btn btn-ghost btn-sm ${page === pagination.current_page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ) : null;
              })}
            </div>

            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="btn btn-ghost btn-sm"
            >
              Next
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;