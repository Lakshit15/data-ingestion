import React from 'react';
import './ColumnSelector.css';

const ColumnSelector = ({ columns, selectedColumns, onSelect }) => {
  const toggleColumn = (columnName) => {
    if (selectedColumns.includes(columnName)) {
      onSelect(selectedColumns.filter(col => col !== columnName));
    } else {
      onSelect([...selectedColumns, columnName]);
    }
  };

  return (
    <div className="column-selector">
      <h3>Select Columns to Export</h3>
      <div className="columns-list">
        {columns.map(col => (
          <label key={col.name} className="column-item">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.name)}
              onChange={() => toggleColumn(col.name)}
            />
            <span className="column-name">{col.name}</span>
            <span className="column-type">{col.type}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ColumnSelector;