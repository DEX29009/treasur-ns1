import React, { useState } from 'react';
import { UserRole } from '../types';
import { verifyCommitteePassword } from '../utils/storage';

interface ProfileSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  onCancel?: () => void;
}

export const ProfileSelectionView: React.FC<ProfileSelectionViewProps> = ({
  onSelectRole,
  onCancel
}) => {
  const [isEnteringCommittee, setIsEnteringCommittee] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCommitteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCommitteePassword(password)) {
      onSelectRole('committee');
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          CLASSE NS1
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Caisse de la classe
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Qui es-tu ?
        </p>

        {!isEnteringCommittee ? (
          <div className="space-y-3 text-left">
            {/* Élève Button */}
            <button
              type="button"
              onClick={() => onSelectRole('student')}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50/70 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👛</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Élève
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-6">
                Voir l'argent entré et les dépenses
              </p>
            </button>

            {/* Membre du comité Button */}
            <button
              type="button"
              onClick={() => {
                setIsEnteringCommittee(true);
                setError('');
              }}
              className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-slate-50/70 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🔑</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Membre du comité
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-6">
                Enregistrer versements et dépenses
              </p>
            </button>

            {onCancel && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Retour à la caisse
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCommitteeSubmit} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mot de passe comité
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Entrez le mot de passe"
                autoFocus
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEnteringCommittee(false);
                  setPassword('');
                  setError('');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                ← Retour
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
