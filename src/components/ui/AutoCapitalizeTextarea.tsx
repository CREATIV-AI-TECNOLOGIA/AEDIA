import React, { forwardRef } from 'react';
import { applyAutoCapitalize } from '../../utils/textUtils';

interface AutoCapitalizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  disableAutoCapitalize?: boolean; // Para casos especiais onde não queremos capitalização
}

const AutoCapitalizeTextarea = forwardRef<HTMLTextAreaElement, AutoCapitalizeTextareaProps>(
  ({ onChange, disableAutoCapitalize = false, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!disableAutoCapitalize) {
        const value = e.target.value;
        const capitalizedValue = applyAutoCapitalize(value, false, {
          name: e.target.name,
          id: e.target.id,
          placeholder: e.target.placeholder
        });
        
        // Atualizar o valor no evento
        e.target.value = capitalizedValue;
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    const defaultClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-vertical";
    const combinedClassName = className || defaultClasses;

    return (
      <textarea
        ref={ref}
        {...props}
        onChange={handleChange}
        className={combinedClassName}
        style={{
          cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
          caretColor: '#000000',
          ...props.style
        }}
      />
    );
  }
);

AutoCapitalizeTextarea.displayName = 'AutoCapitalizeTextarea';

export default AutoCapitalizeTextarea; 