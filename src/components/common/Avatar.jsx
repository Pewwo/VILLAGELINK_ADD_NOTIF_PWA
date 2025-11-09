import React from 'react';

const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-orange-500',
];

// Simple hash function to pick a color based on string
function stringToColorIndex(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colors.length;
}

const Avatar = ({ firstName = '', lastName = '', fullName = '', name = '', profilePic = '', size = 40 }) => {
  // Extract numeric value from size (handles both "40px" and 40)
  const numericSize = typeof size === 'string' ? parseInt(size.replace('px', '')) : size;

  // Generate initials from firstName and lastName or fullName fallback or name fallback
  let initials = '';
  if (firstName && lastName) {
    initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
  } else if (fullName) {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      initials = names[0].charAt(0).toUpperCase();
    } else {
      initials = names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }
  } else if (name) {
    const names = name.trim().split(' ');
    if (names.length === 1) {
      initials = names[0].charAt(0).toUpperCase();
    } else {
      initials = names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }
  } else {
    initials = '??';
  }

  // Pick background color based on fullName or initials
  const colorIndex = stringToColorIndex(fullName || firstName + lastName || initials);
  const bgColor = colors[colorIndex];

  if (profilePic) {
    return (
      <img
        src={profilePic}
        alt={fullName || `${firstName} ${lastName}`}
        className={`rounded-full object-cover`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-semibold select-none bg-blue-600`}
      style={{
        width: size,
        height: size,
        fontSize: numericSize * 0.45
      }}
      aria-label={`Avatar for ${fullName || firstName + ' ' + lastName}`}
      title={fullName || firstName + ' ' + lastName}
    >
      {initials}
    </div>
  );
};

export default Avatar;
