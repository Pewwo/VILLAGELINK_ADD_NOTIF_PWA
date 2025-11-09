// Added imports for cropping and hooks
import React, { useState, useEffect } from 'react';
import AccountUpdateMap from '../partials/AccountMap';
import Avatar from '../common/Avatar';
import CropImageModal from './CropImageModal';

// Modal Components
const NameEditModal = ({ isOpen, onClose, formData, showSuccess, onSave }) => {
  const [localFormData, setLocalFormData] = React.useState({
    firstname: '',
    middlename: '',
    lastname: '',
  });

  const [errors, setErrors] = React.useState({
    firstname: '',
    lastname: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        firstname: formData.firstname || '',
        middlename: formData.middlename || '',
        lastname: formData.lastname || '',
      });
      setErrors({
        firstname: '',
        lastname: '',
      });
    }
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for the field on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSave = async () => {
    // Validate firstname and lastname are not empty or whitespace only
    let hasError = false;
    const newErrors = { firstname: '', lastname: '' };
    if (!localFormData.firstname.trim()) {
      newErrors.firstname = 'First name cannot be empty';
      hasError = true;
    }
    if (!localFormData.lastname.trim()) {
      newErrors.lastname = 'Last name cannot be empty';
      hasError = true;
    }
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not authenticated. Please log in.');
      return;
    }
    const payload = {
      id: userId,
      first_name: localFormData.firstname,
      middle_name: localFormData.middlename,
      last_name: localFormData.lastname,
    };
    try {
      const res = await fetch('https://villagelink.site/backend/api/update_name.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP error! status: ${res.status}, response: ${text}`);
      }
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Name updated successfully');
        onSave(localFormData);
        onClose();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch (error) {
      alert('Error updating name: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Edit Name</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="firstname"
              required
              value={localFormData.firstname}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                errors.firstname ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstname && (
              <p className="text-red-600 text-sm mt-1">{errors.firstname}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              type="text"
              name="middlename"
              value={localFormData.middlename}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter middle name (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="lastname"
              required
              value={localFormData.lastname}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                errors.lastname ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter last name"
            />
            {errors.lastname && (
              <p className="text-red-600 text-sm mt-1">{errors.lastname}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordEditModal = ({ isOpen, onClose, formData, setFormData, handleChange, showPassword, setShowPassword, showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword, showSuccess }) => {
  if (!isOpen) return null;

  const handleSave = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not authenticated. Please log in.');
      return;
    }
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    const payload = {
      id: userId,
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
    };
    try {
      const res = await fetch('https://villagelink.site/backend/api/update_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Password updated successfully');
        
        // Clear the password fields after successful update
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        onClose();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch (error) {
      alert('Error updating password: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ContactEditModal = ({ isOpen, onClose, formData, showSuccess, onSave }) => {
  const [localFormData, setLocalFormData] = React.useState({
    phone: '',
    email: '',
  });

  const [errors, setErrors] = React.useState({
    phone: '',
    email: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        phone: formData.phone || '',
        email: formData.email || '',
      });
      setErrors({
        phone: '',
        email: '',
      });
    }
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setLocalFormData(prev => ({ ...prev, phone: digitsOnly }));
    } else {
      setLocalFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error for the field on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSave = async () => {
    // Validate phone and email are not empty
    let hasError = false;
    const newErrors = { phone: '', email: '' };
    if (!localFormData.phone.trim()) {
      newErrors.phone = 'Phone number cannot be empty';
      hasError = true;
    }
    if (!localFormData.email.trim()) {
      newErrors.email = 'Email address cannot be empty';
      hasError = true;
    }
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not authenticated. Please log in.');
      return;
    }
    const payload = {
      id: userId,
      phone_number: localFormData.phone,
      email: localFormData.email,
    };
    try {
      const res = await fetch('https://villagelink.site/backend/api/update_contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Contact information updated successfully');
        onSave(localFormData);
        onClose();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch (error) {
      alert('Error updating contact information: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Edit Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              maxLength="11"
              required
              value={localFormData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={localFormData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AddressEditModal = ({ isOpen, onClose, formData, showSuccess, onSave }) => {
  const [localFormData, setLocalFormData] = React.useState({
    blk: '',
    lot: '',
    ph: '',
    street: '',
    subdivision: '',
    province: '',
    latitude: '',
    longitude: '',
    locationUrl: '',
  });

  const [errors, setErrors] = React.useState({
    blk: '',
    lot: '',
    ph: '',
    street: '',
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        blk: formData.blk || '',
        lot: formData.lot || '',
        ph: formData.ph || '',
        street: formData.street || '',
        subdivision: formData.subdivision || '',
        province: formData.province || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        locationUrl: formData.locationUrl || '',
      });
      setErrors({
        blk: '',
        lot: '',
        ph: '',
        street: '',
      });
      setCurrentPage(1);
    }
  }, [isOpen, formData]);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for the field on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSave = async () => {
    // Validate blk, lot, ph, and street are not empty
    let hasError = false;
    const newErrors = { blk: '', lot: '', ph: '', street: '' };
    if (!localFormData.blk || localFormData.blk.toString().trim() === '') {
      newErrors.blk = 'Block cannot be empty';
      hasError = true;
    }
    if (!localFormData.lot || localFormData.lot.toString().trim() === '') {
      newErrors.lot = 'Lot cannot be empty';
      hasError = true;
    }
    if (!localFormData.ph || localFormData.ph.toString().trim() === '') {
      newErrors.ph = 'Phase cannot be empty';
      hasError = true;
    }
    if (!localFormData.street || localFormData.street.trim() === '') {
      newErrors.street = 'Street cannot be empty';
      hasError = true;
    }
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not authenticated. Please log in.');
      return;
    }
    const payload = {
      id: userId,
      blk: localFormData.blk,
      lot: localFormData.lot,
      ph: localFormData.ph,
      street: localFormData.street,
      subdivision: localFormData.subdivision,
      province: localFormData.province,
      coordinates: localFormData.latitude && localFormData.longitude ? `${localFormData.latitude},${localFormData.longitude}` : '',
    };
    try {
      const res = await fetch('https://villagelink.site/backend/api/update_address.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Address information updated successfully');
        onSave(localFormData);
        onClose();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch (error) {
      alert('Error updating address information: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-5xl mx-4 h-[90vh] sm:h-[600px] flex flex-col overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Edit Address Information</h3>
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 flex-1 overflow-hidden">
          {isMobile ? (
            currentPage === 1 ? (
              /* Form Section for Mobile Page 1 */
              <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 lg:pr-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                    <input
                      type="number"
                      name="blk"
                      required
                      value={localFormData.blk}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.blk ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Block number"
                      min="0"
                    />
                    {errors.blk && (
                      <p className="text-red-600 text-sm mt-1">{errors.blk}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lot</label>
                    <input
                      type="number"
                      name="lot"
                      required
                      value={localFormData.lot}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.lot ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Lot number"
                      min="0"
                    />
                    {errors.lot && (
                      <p className="text-red-600 text-sm mt-1">{errors.lot}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                    <input
                      type="number"
                      name="ph"
                      required
                      value={localFormData.ph}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.ph ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Phase number"
                      min="0"
                    />
                    {errors.ph && (
                      <p className="text-red-600 text-sm mt-1">{errors.ph}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={localFormData.street}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.street ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Street name"
                    />
                    {errors.street && (
                      <p className="text-red-600 text-sm mt-1">{errors.street}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subdivision</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {localFormData.subdivision}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {localFormData.province}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Map Section for Mobile Page 2 */
              <div className="flex flex-col h-full lg:min-h-[400px]">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2">Location Coordinates</h4>
                <div className="w-full h-[250px] sm:h-[350px] flex-1 rounded-lg overflow-hidden">
                  <AccountUpdateMap
                    coordinates={localFormData.locationUrl || ''}
                    locationUrl={localFormData.locationUrl || ''}
                    address={`${localFormData.blk}, ${localFormData.lot}, ${localFormData.ph}, ${localFormData.street}, ${localFormData.subdivision}, ${localFormData.province}`}
                    onCoordinatesChange={(coords) => {
                      const [lat, lng] = coords;
                      const newLocationUrl = `https://maps.google.com/?q=${lat},${lng}`;
                      setLocalFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString(), locationUrl: newLocationUrl }));
                    }}
                    height="100%"
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on the map to select the location coordinates for this user.
                </p>
              </div>
            )
          ) : (
            <>
              {/* Form Section for Desktop */}
              <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 lg:pr-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                    <input
                      type="number"
                      name="blk"
                      required
                      value={localFormData.blk}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.blk ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Block number"
                      min="0"
                    />
                    {errors.blk && (
                      <p className="text-red-600 text-sm mt-1">{errors.blk}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lot</label>
                    <input
                      type="number"
                      name="lot"
                      required
                      value={localFormData.lot}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.lot ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Lot number"
                      min="0"
                    />
                    {errors.lot && (
                      <p className="text-red-600 text-sm mt-1">{errors.lot}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                    <input
                      type="number"
                      name="ph"
                      required
                      value={localFormData.ph}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.ph ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Phase number"
                      min="0"
                    />
                    {errors.ph && (
                      <p className="text-red-600 text-sm mt-1">{errors.ph}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={localFormData.street}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        errors.street ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Street name"
                    />
                    {errors.street && (
                      <p className="text-red-600 text-sm mt-1">{errors.street}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subdivision</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {localFormData.subdivision}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {localFormData.province}
                    </div>
                  </div>
                </div>
              </div>
              {/* Map Section for Desktop */}
              <div className="flex flex-col h-full lg:min-h-[400px]">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-2">Location Coordinates</h4>
                <div className="w-full h-[250px] sm:h-[350px] flex-1 rounded-lg overflow-hidden">
                  <AccountUpdateMap
                    coordinates={localFormData.locationUrl || ''}
                    locationUrl={localFormData.locationUrl || ''}
                    address={`${localFormData.blk}, ${localFormData.lot}, ${localFormData.ph}, ${localFormData.street}, ${localFormData.subdivision}, ${localFormData.province}`}
                    onCoordinatesChange={(coords) => {
                      const [lat, lng] = coords;
                      const newLocationUrl = `https://maps.google.com/?q=${lat},${lng}`;
                      setLocalFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString(), locationUrl: newLocationUrl }));
                    }}
                    height="100%"
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on the map to select the location coordinates for this user.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6 pt-2 border-t border-gray-200">
          {isMobile ? (
            currentPage === 1 ? (
              <button
                onClick={() => setCurrentPage(2)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </>
            )
          ) : (
            <>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2f] rounded-lg p-6 w-full max-w-md mx-4 text-white shadow-lg">
        <h3 className="text-lg font-semibold mb-4 uppercase">Success</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal states
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);

  const [formData, setFormData] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    phone: '',
    email: '',
    password: '',
    profilePic: '',
    blk: '',
    lot: '',
    ph: '',
    street: '',
    subdivision: 'Residencia De Muzon',
    province: 'City of San Jose Del Monte, Bulacan',
    latitude: '',
    longitude: '',
    locationUrl: '',
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    fetch(`https://villagelink.site/backend/api/get_profile.php?id=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          const user = data.data;

          // Construct locationUrl from latitude and longitude if available
          let locationUrl = '';
          if (user.latitude && user.longitude) {
            locationUrl = `https://maps.google.com/?q=${user.latitude},${user.longitude}`;
          }

          const backendBaseUrl = 'https://villagelink.site/backend/';
          setFormData({
            firstname: user.name.split(' ')[0] || '',
            middlename: user.name.split(' ').length > 2 ? user.name.split(' ')[1] : '',
            lastname: user.name.split(' ').length > 2 ? user.name.split(' ')[2] : user.name.split(' ')[1] || '',
            phone: user.phone || '',
            email: user.email || '',
            password: '', // Keep password empty for security - never display decrypted password
            profilePic: user.profile_picture ? backendBaseUrl + user.profile_picture : '',
            blk: user.blk || '',
            lot: user.lot || '',
            ph: user.ph || '',
            street: user.street || '',
            subdivision: user.subdivision || 'Residencia De Muzon',
            province: user.province || 'City of San Jose Del Monte, Bulacan',
            latitude: user.latitude || '',
            longitude: user.longitude || '',
            locationUrl: locationUrl,
          });
          setError(null);
        } else {
          setError(data.message || 'Failed to load profile data');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Modal handlers
  const openNameModal = () => setNameModalOpen(true);
  const closeNameModal = () => setNameModalOpen(false);

  const openContactModal = () => setContactModalOpen(true);
  const closeContactModal = () => setContactModalOpen(false);

  const openPasswordModal = () => setPasswordModalOpen(true);
  const closePasswordModal = () => setPasswordModalOpen(false);

  const openAddressModal = () => setAddressModalOpen(true);
  const closeAddressModal = () => setAddressModalOpen(false);

  // Success modal handlers
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setSuccessModalOpen(true);
  };
  const closeSuccessModal = () => {
    setSuccessModalOpen(false);
    setSuccessMessage('');
  };

  // Cropping handlers
  const handleFileChange = (e) => {
    console.log('handleFileChange triggered');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('FileReader onload triggered');
        setSelectedImage(reader.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setSelectedImage(null);
    setCroppedImageUrl('');
    setCroppedImageBlob(null);
  };

  const handleCropConfirm = (croppedImageBlob, croppedImageUrl) => {
    setCroppedImageUrl(croppedImageUrl);
    setCroppedImageBlob(croppedImageBlob);
    setCropModalOpen(false);
    setSelectedImage(null);
    // Upload the cropped image
    uploadProfilePic(croppedImageBlob);
  };

  const uploadProfilePic = async (imageBlob) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User not authenticated. Please log in.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('profilePic', imageBlob, 'profile-pic.jpg');
    formDataToSend.append('id', userId);

    try {
      const res = await fetch('https://villagelink.site/backend/api/update_profilepic.php', {
        method: 'POST',
        body: formDataToSend,
      });
      const data = await res.json();
      if (data.status === 'success') {
        showSuccess('Profile picture updated successfully');
      }
    } catch (error) {
      alert('Error uploading profile picture: ' + error.message);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading profile...</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
          {/* Header Section */}
            <div className="mb-4 sm:mb-8">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Profile Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-lg">
                Update and manage resident account details with ease.
              </p>
            </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            
            
            

            <div className="p-6 space-y-8">
              {/* Profile Picture Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Profile Picture</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {(croppedImageUrl || formData.profilePic) ? (
                    <Avatar
                      profilePic={croppedImageUrl || formData.profilePic}
                      firstName={formData.firstname}
                      lastName={formData.lastname}
                      alt="Profile Picture"
                      size={80}
                      className="border-4 border-white shadow-lg sm:size-100"
                    />
                  ) : (
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg sm:text-2xl border-4 border-white shadow-lg">
                      {(formData.firstname?.[0] || '') + (formData.lastname?.[0] || '')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Upload a new profile picture to personalize your account</p>
                    <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 min-h-[40px] sm:min-h-[44px] w-full sm:w-auto justify-center">
                      <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Name Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Name Information</h2>
                  </div>
                  <button
                    onClick={openNameModal}
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[40px] sm:min-h-[44px] w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Name
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="text-gray-900 text-sm">{formData.firstname || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <p className="text-gray-900 text-sm">{formData.middlename || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="text-gray-900 text-sm">{formData.lastname || '--'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Contact Information</h2>
                  </div>
                  <button
                    onClick={openContactModal}
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[40px] sm:min-h-[44px] w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Contact
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900 text-sm">{formData.phone || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <p className="text-gray-900 text-sm">{formData.email || '--'}</p>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Password</h2>
                  </div>
                  <button
                    onClick={openPasswordModal}
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[40px] sm:min-h-[44px] w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Change Password
                  </button>
                </div>
                <p className="text-gray-600 text-sm">For security reasons, your current password is not displayed.</p>
              </div>

              {/* Address Information Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Address Information</h2>
                  </div>
                  <button
                    onClick={openAddressModal}
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[40px] sm:min-h-[44px] w-full sm:w-auto justify-center"
                  >
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Address
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Block</label>
                    <p className="text-gray-900 text-sm">{formData.blk || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Lot</label>
                    <p className="text-gray-900 text-sm">{formData.lot || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phase</label>
                    <p className="text-gray-900 text-sm">{formData.ph || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Street</label>
                    <p className="text-gray-900 text-sm">{formData.street || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subdivision</label>
                    <p className="text-gray-900 text-sm">{formData.subdivision || '--'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Province</label>
                    <p className="text-gray-900 text-sm">{formData.province || '--'}</p>
                  </div>
                </div>

                </div>

                {/* Modals */}
      <NameEditModal
        isOpen={nameModalOpen}
        onClose={closeNameModal}
        formData={formData}
        showSuccess={showSuccess}
        onSave={(updatedData) => {
          setFormData(prev => ({ ...prev, ...updatedData }));
        }}
      />

      <ContactEditModal
        isOpen={contactModalOpen}
        onClose={closeContactModal}
        formData={formData}
        showSuccess={showSuccess}
        onSave={(updatedData) => {
          setFormData(prev => ({ ...prev, ...updatedData }));
        }}
      />

      <PasswordEditModal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        showSuccess={showSuccess}
      />

      <AddressEditModal
        isOpen={addressModalOpen}
        onClose={closeAddressModal}
        formData={formData}
        showSuccess={showSuccess}
        onSave={(updatedData) => {
          setFormData(prev => ({ ...prev, ...updatedData }));
        }}
      />

      <SuccessModal
        isOpen={successModalOpen}
        message={successMessage}
        onClose={closeSuccessModal}
      />

      {/* Crop Image Modal */}
      <CropImageModal
        isOpen={cropModalOpen}
        imageSrc={selectedImage}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
