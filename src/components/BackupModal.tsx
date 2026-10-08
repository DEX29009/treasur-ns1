import React, { useState, useRef, useEffect } from 'react';
import { Student, Contribution, Expense, Project, BackupSnapshot } from '../types';
import { formatCurrency } from '../utils/grades';
import { 
  getBackupSnapshots, 
  exportBackupToFile, 
  parseBackupFile, 
  saveLocalBackup, 
  deleteBackupSnapshot 
} from '../utils/backupService';
import { X, Download, Upload, ShieldCheck, History, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  contributions: Contribution[];
  expenses: Expense[];
  projects: Project[];
  onRestoreData: (data: {
    students: Student[];
    contributions: Contribution[];
    expenses: Expense[];
    projects: Project[];
  }) => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  students,
  contributions,
  expenses,
  projects,
  onRestoreData
}) => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getBackupSnapshots());
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      exportBackupToFile(students, contributions, expenses, projects);
      saveLocalBackup(students, contributions, expenses, projects, 'Export fichier');
      setSnapshots(getBackupSnapshots());
      setFeedback({
        type: 'success',
        message: 'Fichier de sauvegarde téléchargé avec succès ! Conservez-le précieusement.'
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Impossible de télécharger la sauvegarde.'
      });
    }
  };

  const handleCreateSnapshot = () => {
    const snap = saveLocalBackup(students, contributions, expenses, projects, 'Sauvegarde manuelle');
    if (snap) {
      setSnapshots(getBackupSnapshots());
      setFeedback({
        type: 'success',
        message: 'Point de restauration créé avec succès !'
      });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      const data = await parseBackupFile(file);
      if (window.confirm(`Confirmez-vous la restauration de ${data.contributions.length} versement(s) et ${data.expenses.length} dépense(s) ?`)) {
        await onRestoreData(data);
        saveLocalBackup(data.students, data.contributions, data.expenses, data.projects, 'Restauration fichier');
        setSnapshots(getBackupSnapshots());
        setFeedback({
          type: 'success',
          message: 'Toutes les données ont été restaurées avec succès dans la caisse !'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Fichier de sauvegarde invalide.'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreSnapshot = async (snap: BackupSnapshot) => {
    if (window.confirm(`Voulez-vous restaurer la sauvegarde du ${snap.dateFormatted} (${snap.contributionsCount} versements, ${snap.expensesCount} dépenses) ?`)) {
      setIsProcessing(true);
      setFeedback(null);
      try {
        await onRestoreData(snap.data);
        setFeedback({
          type: 'success',
          message: `Données restaurées à l'état du ${snap.dateFormatted} !`
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'Erreur lors de la restauration.'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteBackupSnapshot(id);
    setSnapshots(updated);
  };

  const totalIn = contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalOut = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Centre de Sauvegarde & Sécurité
            </h2>
            <p className="text-xs text-slate-500">
              Exportez, restaurez et sécurisez l'intégralité des données de la caisse
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current State Summary */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-500 block">État actuel de la caisse :</span>
            <span className="font-bold text-slate-900">
              {contributions.length} versement(s) · {expenses.length} dépense(s) · {projects.length} projet(s)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Solde actif :</span>
            <span className="font-mono font-black text-emerald-700 text-sm">
              {formatCurrency(totalIn - totalOut)}
            </span>
          </div>
        </div>

        {/* 2 Main Actions: Export / Import */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Export to File */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exporter sur mon appareil</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Télécharge un fichier <strong>.json</strong> contenant tous les versements, dépenses et projets pour les garder à l'abri hors-ligne.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger la sauvegarde</span>
            </button>
          </div>

          {/* Import from File */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs mb-1">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Restaurer depuis un fichier</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Sélectionnez un fichier <strong>.json</strong> de sauvegarde pour réinjecter immédiatement toutes les cotisations dans la caisse.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="backup-file-input"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Restauration...' : 'Importer un fichier .json'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Snapshots History */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Points de restauration enregistrés ({snapshots.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleCreateSnapshot}
              className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Créer un point maintenant</span>
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
              Aucun point de restauration historique pour l'instant. L'application en crée automatiquement à chaque opération.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">
                        {snap.dateFormatted}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {snap.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {snap.contributionsCount} versement(s) · {snap.expensesCount} dépense(s) · Solde : <strong className="text-slate-700 font-mono">{formatCurrency(snap.balance)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Restaurer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Supprimer ce point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
