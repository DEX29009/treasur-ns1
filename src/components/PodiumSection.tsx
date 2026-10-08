import React from 'react';
import { Student } from '../types';
import { formatCurrency, getGradeForAmount } from '../utils/grades';
import { Crown, Trophy, Medal } from 'lucide-react';

interface PodiumSectionProps {
  students: Student[];
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({ students }) => {
  // Sort students descending by total contributed
  const topStudents = [...students]
    .sort((a, b) => b.totalContributed - a.totalContributed)
    .slice(0, 3);

  const first = topStudents[0];
  const second = topStudents[1];
  const third = topStudents[2];

  const hasDonors = (first && first.totalContributed > 0) || 
                    (second && second.totalContributed > 0) || 
                    (third && third.totalContributed > 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Piédestal des meilleurs donateurs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Podium d'honneur des 3 plus grands contributeurs de la classe NS1
          </p>
        </div>
      </div>

      {!hasDonors ? (
        <div className="text-center py-8 px-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-xs font-semibold text-slate-700">Le piédestal est prêt !</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
            Les 3 élèves ayant versé le plus de cotisations monteront sur les marches 1ère, 2ème et 3ème place dès les premiers versements.
          </p>
        </div>
      ) : (
        <div className="pt-6 pb-2">
          {/* Podium Container: 2nd (left), 1st (center), 3rd (right) */}
          <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-lg mx-auto">
            
            {/* 2nd Place (Silver) */}
            <div className="flex-1 flex flex-col items-center text-center">
              {second && second.totalContributed > 0 ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-lg shadow-xs mb-1.5">
                    🥈
                  </div>
                  <div className="w-full px-1 mb-2 min-h-[4rem] flex flex-col justify-end items-center">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 w-full" title={second.name}>
                      {second.name}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 mt-0.5">
                      {formatCurrency(second.totalContributed)}
                    </span>
                    {(() => {
                      const g = getGradeForAmount(second.totalContributed);
                      return (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border mt-1 ${g.badgeColor}`}>
                          <span>{g.emoji}</span>
                          <span className="truncate max-w-[80px]">{g.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="h-16 flex items-center text-xs text-slate-300 font-medium">
                  En attente
                </div>
              )}
              {/* Pedestal Step */}
              <div className="w-full bg-linear-to-t from-slate-200 to-slate-100 border-t-4 border-slate-300 rounded-t-xl h-24 flex flex-col items-center justify-center shadow-inner">
                <span className="text-xl sm:text-2xl font-black text-slate-500">2</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2ème place</span>
              </div>
            </div>

            {/* 1st Place (Gold - Highest) */}
            <div className="flex-1 flex flex-col items-center text-center -mt-6">
              {first && first.totalContributed > 0 ? (
                <>
                  <div className="relative mb-1.5">
                    <Crown className="w-5 h-5 text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                    <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-xl shadow-md">
                      🥇
                    </div>
                  </div>
                  <div className="w-full px-1 mb-2 min-h-[4rem] flex flex-col justify-end items-center">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 w-full" title={first.name}>
                      {first.name}
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 mt-0.5">
                      {formatCurrency(first.totalContributed)}
                    </span>
                    {(() => {
                      const g = getGradeForAmount(first.totalContributed);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 shadow-xs ${g.badgeColor}`}>
                          <span>{g.emoji}</span>
                          <span className="truncate max-w-[95px]">{g.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="h-20 flex items-center text-xs text-slate-300 font-medium">
                  En attente
                </div>
              )}
              {/* Pedestal Step */}
              <div className="w-full bg-linear-to-t from-amber-200 to-amber-100 border-t-4 border-amber-400 rounded-t-xl h-32 flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl font-black text-amber-800">1</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">1ère place</span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex-1 flex flex-col items-center text-center">
              {third && third.totalContributed > 0 ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-orange-50 border-2 border-amber-600/50 flex items-center justify-center text-lg shadow-xs mb-1.5">
                    🥉
                  </div>
                  <div className="w-full px-1 mb-2 min-h-[4rem] flex flex-col justify-end items-center">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 w-full" title={third.name}>
                      {third.name}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 mt-0.5">
                      {formatCurrency(third.totalContributed)}
                    </span>
                    {(() => {
                      const g = getGradeForAmount(third.totalContributed);
                      return (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border mt-1 ${g.badgeColor}`}>
                          <span>{g.emoji}</span>
                          <span className="truncate max-w-[80px]">{g.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="h-14 flex items-center text-xs text-slate-300 font-medium">
                  En attente
                </div>
              )}
              {/* Pedestal Step */}
              <div className="w-full bg-linear-to-t from-orange-100 to-amber-50 border-t-4 border-amber-600/40 rounded-t-xl h-18 flex flex-col items-center justify-center shadow-inner">
                <span className="text-xl sm:text-2xl font-black text-amber-900/70">3</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70">3ème place</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
