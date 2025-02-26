import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: string;
  color?: string;
}

export default function StatCard({ title, value, icon = "📊", color = "bg-blue-50" }: StatCardProps) {
  return (
    <div className={`p-6 rounded-lg shadow ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
