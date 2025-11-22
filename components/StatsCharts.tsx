import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DomainStats } from '../types';

interface StatsChartsProps {
  stats: DomainStats;
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-gray-600 text-sm font-bold mb-4 uppercase tracking-wider border-b pb-2 border-gray-100">Distribuição por Tamanho</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byLength}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                cursor={{fill: 'rgba(158, 196, 33, 0.1)'}}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#333', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#9ec421' }}
              />
              <Bar dataKey="value" fill="#9ec421" radius={[4, 4, 0, 0]}>
                {stats.byLength.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#9ec421' : '#8db11d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-gray-600 text-sm font-bold mb-4 uppercase tracking-wider border-b pb-2 border-gray-100">Top Iniciais (A-Z)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byLetter.slice(0, 15)}>
               <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(158, 196, 33, 0.1)'}}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#333', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                 {stats.byLetter.slice(0, 15).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#9ec421' : '#8db11d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};