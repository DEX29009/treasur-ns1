import React, { useState } from 'react';
import { Project } from '../types';
import { X, Target } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez donner un nom au projet.');
      return;
    }

    let targetAmount: number | undefined = undefined;
    if (hasTarget) {
      const parsed = parseFloat(targetAmountStr);
      if (!parsed || parsed <= 0) {
        setError('Veuillez entrer un montant d\'objectif valide supérieur à 0 HTG.');
        return;
      }
      targetAmount = parsed;
    }

    onAddProject({
      name: name.trim(),
      description: description.trim() || undefined,
      hasTarget,
      targetAmount
    });

    setName('');
    setDescription('');
    setHasTarget(false);
    setTargetAmountStr('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            🎯
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Nouveau projet de classe
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Créez un projet de classe avec ou sans objectif financier
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nom du projet *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Maillots de classe, Fête de fin d'année, Journée créole"
              required
              autoFocus
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez les détails ou l'utilité du projet..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Toggle hasTarget: Oui ou Non */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                Ajouter un objectif financier ?
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHasTarget(false)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    !hasTarget ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Non
                </button>
                <button
                  type="button"
                  onClick={() => setHasTarget(true)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    hasTarget ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Oui
                </button>
              </div>
            </div>

            {hasTarget && (
              <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                <label className="block font-semibold text-slate-700 mb-1">
                  Montant de l'objectif (HTG) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={targetAmountStr}
                  onChange={(e) => {
                    setTargetAmountStr(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ex: 15000"
                  required={hasTarget}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
