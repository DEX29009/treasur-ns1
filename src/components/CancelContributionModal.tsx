import React, { useState, useEffect } from 'react';
import { Contribution } from '../types';
import { formatCurrency } from '../utils/grades';
import { verifyExpensePin } from '../utils/storage';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CancelContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: Contribution | null;
  onConfirmCancel: (contribution: Contribution) => void;
}

export const CancelContributionModal: React.FC<CancelContributionModalProps> = ({
  isOpen,
  onClose,
  contribution,
  onConfirmCancel
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !contribution) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verifyExpensePin(pin)) {
      setError('Code PIN du comité incorrect.');
      return;
    }

    onConfirmCancel(contribution);
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

        <div className="flex items-center gap-2.5 text-rose-700 mb-2">
          <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Annuler un versement
            </h2>
            <p className="text-xs text-rose-600 font-medium">
              Action réservée au comité de classe
            </p>
          </div>
        </div>

        {/* Contribution details card */}
        <div className="my-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Élève :</span>
            <span className="font-bold text-slate-900">{contribution.studentName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Montant :</span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              +{formatCurrency(contribution.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Reçu N° :</span>
            <span className="font-mono font-semibold text-slate-700">{contribution.receiptNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Date & Motif :</span>
            <span className="text-slate-700">{contribution.date} · {contribution.motif}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Moyen de paiement :</span>
            <span className="text-slate-700">{contribution.paymentMethod}</span>
          </div>

          {contribution.projectName && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
              <span className="text-slate-500">Projet associé :</span>
              <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                🎯 {contribution.projectName}
              </span>
            </div>
          )}
        </div>

        {/* Warning text */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1 mb-4">
          <p className="font-semibold flex items-center gap-1.5 text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Conséquences de l'annulation :
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
            <li>Le montant sera retiré de la caisse générale de classe.</li>
            <li>Le cumul cotisé et le grade de l'élève seront recalculés.</li>
            {contribution.projectName && (
              <li>La cagnotte du projet associé sera diminuée d'autant.</li>
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Code PIN d'autorisation (Comité) *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="•••••"
              autoFocus
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 tracking-widest focus:outline-none focus:border-rose-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Conserver le versement
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              Confirmer l'annulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
