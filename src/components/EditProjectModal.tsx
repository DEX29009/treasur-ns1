import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { X, Target, Calendar, CheckCircle2, RotateCcw, Coins } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onDeleteProject
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paid'>('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setHasTarget(Boolean(project.hasTarget));
      setTargetAmountStr(project.targetAmount ? String(project.targetAmount) : '');
      setDeadline(project.deadline || '');
      setStatus(project.status || 'active');
      setError('');
    }
  }, [project]);

  if (!isOpen || !project) return null;

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

    onUpdateProject(project.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      hasTarget,
      targetAmount,
      deadline: deadline.trim() || undefined,
      status
    });

    onClose();
  };

  const handleToggleStatus = () => {
    if (status === 'paid') {
      if (window.confirm('Ce projet a été marqué comme payé. Voulez-vous le rouvrir en statut actif ?')) {
        setStatus('active');
      }
      return;
    }
    const nextStatus = status === 'active' ? 'completed' : 'active';
    setStatus(nextStatus);
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
            ✏️
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Modifier le projet
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Ajustez les détails, la date limite ou le statut du projet
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
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
              required
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
              placeholder="Précisez les détails du projet..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date limite (optionnel)</span>
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="Ex: 25/11/2026 ou Fin décembre"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Toggle hasTarget: Oui ou Non */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                Objectif financier ?
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

          {/* Statut du projet : Actif, Terminé ou Payé */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">
                Statut du projet
              </span>
              <span className="text-[11px] text-slate-500">
                {status === 'paid' 
                  ? 'Ce projet a été payé et ses fonds retirés.'
                  : status === 'completed' 
                    ? 'Ce projet est clôturé et terminé.' 
                    : 'Ce projet est actuellement en cours.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                status === 'paid'
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : status === 'completed'
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300 border border-slate-300'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              {status === 'paid' ? (
                <>
                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                  <span>Statut : Payé</span>
                </>
              ) : status === 'completed' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rouvrir</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mettre fin au projet</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Voulez-vous supprimer définitivement ce projet ?')) {
                  onDeleteProject(project.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 underline cursor-pointer"
            >
              Supprimer le projet
            </button>

            <div className="flex gap-2">
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
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
