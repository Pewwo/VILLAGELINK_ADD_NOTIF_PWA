import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomDatePicker = forwardRef(({
  selected,
  onChange,
  placeholder = "Select a date...",
  dateFormat = "MMMM d, yyyy",
  showPopperArrow = false,
  className = "",
  label = "",
  error = "",
  required = false,
  minDate = null,
  maxDate = null,
  disabled = false,
  isClearable = true,
  showYearDropdown = true,
  showMonthDropdown = true,
  dropdownMode = "select",
  yearDropdownItemNumber = 10,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-4">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <DatePicker
          ref={ref}
          selected={selected}
          onChange={onChange}
          dateFormat={dateFormat}
          placeholderText={placeholder}
          showPopperArrow={showPopperArrow}
          className={`
            w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          isClearable={isClearable}
          showYearDropdown={showYearDropdown}
          showMonthDropdown={showMonthDropdown}
          dropdownMode={dropdownMode}
          yearDropdownItemNumber={yearDropdownItemNumber}
          {...props}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

CustomDatePicker.displayName = 'CustomDatePicker';

export default CustomDatePicker;
