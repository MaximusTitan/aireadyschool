import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
}

export default function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
