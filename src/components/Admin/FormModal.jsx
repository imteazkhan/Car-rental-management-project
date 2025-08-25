import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './Modal';
import './Modal.css';

const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  fields = [], 
  initialData = {},
  loading = false,
  submitLabel = 'Save',
  size = 'medium'
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Memoize the fields processing to prevent unnecessary recalculations
  // Stringify fields and initialData to create stable dependencies
  const fieldsString = useMemo(() => JSON.stringify(fields), [fields]);
  const initialDataString = useMemo(() => JSON.stringify(initialData), [initialData]);
  
  const processedInitialData = useMemo(() => {
    if (!isOpen) return {};
    
    const initialFormData = {};
    
    const processFields = (fieldList) => {
      fieldList.forEach(field => {
        if (field.type === 'group' && field.fields) {
          // Process grouped fields
          processFields(field.fields);
        } else {
          // Process individual fields
          initialFormData[field.name] = initialData[field.name] || field.defaultValue || '';
        }
      });
    };
    
    processFields(fields);
    return initialFormData;
  }, [isOpen, fieldsString, initialDataString]);

  // Only reset form when modal opens or when the actual data content changes
  useEffect(() => {
    if (isOpen) {
      // Only update if the data has actually changed
      setFormData(prevData => {
        const newData = processedInitialData;
        // Compare stringified versions to avoid unnecessary updates
        if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
          return newData;
        }
        return prevData;
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen, fieldsString, initialDataString]);

  // Remove formData dependency from validateField
  const validateField = useCallback((field, value, currentFormData = {}) => {
    const { name, label, required, validation, type } = field;
    
    // Required validation
    if (required && (!value || value.toString().trim() === '')) {
      return `${label} is required`;
    }

    // Type-specific validation
    if (value && value.toString().trim() !== '') {
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }

      if (type === 'url') {
        try {
          new URL(value);
        } catch {
          return 'Please enter a valid URL';
        }
      }

      if (type === 'number') {
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        if (field.min !== undefined && Number(value) < field.min) {
          return `Value must be at least ${field.min}`;
        }
        if (field.max !== undefined && Number(value) > field.max) {
          return `Value must be at most ${field.max}`;
        }
      }

      if (type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date';
        }
        if (field.minDate && date < new Date(field.minDate)) {
          return `Date must be after ${field.minDate}`;
        }
        if (field.maxDate && date > new Date(field.maxDate)) {
          return `Date must be before ${field.maxDate}`;
        }
      }

      // Custom validation - pass currentFormData as parameter instead of using closure
      if (validation) {
        if (typeof validation === 'function') {
          const result = validation(value, currentFormData);
          if (result !== true) {
            return result;
          }
        } else if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return validation.message || `${label} format is invalid`;
          }
        }
      }
    }

    return null;
  }, []); // Empty dependency array since we pass formData as parameter

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    const processFields = (fieldList) => {
      fieldList.forEach(field => {
        if (field.type === 'group' && field.fields) {
          // Process grouped fields
          processFields(field.fields);
        } else {
          // Process individual fields
          const error = validateField(field, formData[field.name], formData);
          if (error) {
            newErrors[field.name] = error;
            isValid = false;
          }
        }
      });
    };

    processFields(fields);
    setErrors(newErrors);
    return isValid;
  }, [fields, formData, validateField]);

  const handleFieldChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleFieldBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Find field in potentially grouped structure
    const findField = (fieldList, fieldName) => {
      for (const field of fieldList) {
        if (field.type === 'group' && field.fields) {
          const found = findField(field.fields, fieldName);
          if (found) return found;
        } else if (field.name === fieldName) {
          return field;
        }
      }
      return null;
    };

    const field = findField(fields, name);
    if (field) {
      const error = validateField(field, formData[name], formData);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [fields, formData, validateField]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    
    const processFields = (fieldList) => {
      fieldList.forEach(field => {
        if (field.type === 'group' && field.fields) {
          // Process grouped fields
          processFields(field.fields);
        } else {
          // Process individual fields
          allTouched[field.name] = true;
        }
      });
    };
    
    processFields(fields);
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit(formData);
    }
  }, [fields, formData, validateForm, onSubmit]);

  const renderField = (field) => {
    const { 
      name, 
      label, 
      type = 'text', 
      placeholder, 
      required, 
      options = [], 
      help,
      disabled,
      rows = 3
    } = field;

    const value = formData[name] || '';
    const error = touched[name] ? errors[name] : null;
    const fieldId = `field-${name}`;

    const commonProps = {
      id: fieldId,
      name,
      value,
      disabled: disabled || loading,
      onChange: (e) => handleFieldChange(name, e.target.value),
      onBlur: () => handleFieldBlur(name),
      className: `form-input ${error ? 'error' : ''}`
    };

    return (
      <div key={name} className="form-group">
        <label htmlFor={fieldId} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            {...commonProps}
            rows={rows}
            placeholder={placeholder}
            className={`form-textarea ${error ? 'error' : ''}`}
          />
        ) : type === 'select' ? (
          <select
            {...commonProps}
            className={`form-select ${error ? 'error' : ''}`}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(option => (
              <option 
                key={typeof option === 'string' ? option : option.value} 
                value={typeof option === 'string' ? option : option.value}
              >
                {typeof option === 'string' ? option : option.label}
              </option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <div className="form-checkbox-group">
            <input
              type="checkbox"
              id={fieldId}
              name={name}
              checked={Boolean(value)}
              disabled={disabled || loading}
              onChange={(e) => handleFieldChange(name, e.target.checked)}
              className="form-checkbox"
            />
            <span>{placeholder}</span>
          </div>
        ) : type === 'radio' ? (
          <div className="form-radio-group">
            {options.map(option => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <div key={optionValue} className="form-radio-item">
                  <input
                    type="radio"
                    id={`${fieldId}-${optionValue}`}
                    name={name}
                    value={optionValue}
                    checked={value === optionValue}
                    disabled={disabled || loading}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                    className="form-radio"
                  />
                  <label htmlFor={`${fieldId}-${optionValue}`}>{optionLabel}</label>
                </div>
              );
            })}
          </div>
        ) : (
          <input
            {...commonProps}
            type={type}
            placeholder={placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )}
        
        {error && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}
        
        {help && !error && (
          <div className="form-help">{help}</div>
        )}
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size={size}
      className={loading ? 'modal-loading' : ''}
    >
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Processing...</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {fields.map(field => {
          if (field.type === 'group') {
            return (
              <div key={field.name} className={`form-row ${field.columns ? `${field.columns}-columns` : ''}`}>
                {field.fields.map(renderField)}
              </div>
            );
          }
          return renderField(field);
        })}
        
        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? '' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;