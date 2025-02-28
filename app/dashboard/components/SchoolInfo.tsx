import React from 'react';

interface School {
  id: string;
  name: string;
  address?: string;
  site_id: string;
}

interface SchoolInfoProps {
  school: School;
  userRole: 'teacher' | 'student' | 'admin';
  size?: 'normal' | 'small';
}

export default function SchoolInfo({ school, userRole, size = 'normal' }: SchoolInfoProps) {
  const isSmall = size === 'small';
  
  return (
    <div className={`bg-white shadow rounded-lg ${isSmall ? 'p-4' : 'p-6'} mb-6`}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`${isSmall ? 'text-lg' : 'text-2xl'} font-bold text-gray-800`}>{school.name}</h1>
          {school.address && (
            <p className={`text-gray-600 ${isSmall ? 'text-xs' : 'text-sm'} mt-1`}>{school.address}</p>
          )}
          <p className="mt-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </p>
        </div>
        <div className={isSmall ? 'text-3xl' : 'text-5xl'}>🏫</div>
      </div>
    </div>
  );
}
