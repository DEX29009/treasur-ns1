import React from 'react';
import { Student } from '../types';
import { GRADE_TIERS, getGradeForAmount } from '../utils/grades';

interface GradesTableSectionProps {
  students: Student[];
  onFilterByGrade?: (gradeId: string | null) => void;
  selectedGradeId?: string | null;
}

export const GradesTableSection: React.FC<GradesTableSectionProps> = ({
  students,
  onFilterByGrade,
  selectedGradeId
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mt-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>📊</span>
          <span>Tableau des grades</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Le grade dépend de l'argent total versé par l'élève.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 pr-4 font-semibold">GRADE</th>
              <th className="py-3 px-4 font-semibold">TOTAL VERSÉ</th>
              <th className="py-3 pl-4 text-right font-semibold">ÉLÈVES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {GRADE_TIERS.map((tier) => {
              const count = students.filter(s => {
                const g = getGradeForAmount(s.totalContributed);
                return g?.id === tier.id;
              }).length;

              const isSelected = selectedGradeId === tier.id;

              return (
                <tr
                  key={tier.id}
                  onClick={() => onFilterByGrade && onFilterByGrade(isSelected ? null : tier.id)}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-emerald-50/60 font-medium' : ''
                  } ${onFilterByGrade ? 'cursor-pointer' : ''}`}
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{tier.emoji}</span>
                      <span className="font-semibold text-slate-800">
                        {tier.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-normal">
                    {tier.description}
                  </td>
                  <td className="py-3.5 pl-4 text-right font-bold text-slate-900">
                    {count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
