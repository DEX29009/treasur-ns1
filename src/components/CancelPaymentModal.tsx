import React, { useState } from 'react';
import { Contribution } from '../types';
import { formatCurrency } from '../utils/grades';
import { verifyExpensePin } from '../utils/storage';
import { X, AlertTriangle, ShieldAlert, Trash2, Receipt, Calendar, User, Target } from 'lucide-react';

interface CancelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: Contribution | null;
  onConfirmCancel: (contribution: Contribution) => Promise<void> | void;
}

export const CancelPaymentModal: React.FC<CancelPaymentModalProps> = ({
  isOpen,
  onClose,
  contribution,
  onConfirmCancel
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(`${''}`);

  if (!isOpen || !contribution) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifyExpensePin(pin)) {
      setError('Code PIN du comité incorrect.');
      return;
    }

    try {
      setIsSubmitting('1');
      await onConfirmCancel(contribution);
      setPin('');
      setError('');
      setIsSubmitting('');
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'annulation du versement:', err);
      setError('Une erreur est survenue lors de l\'annulation.');
      setIsSubmitting('');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    setIsSubmitting('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
        <button
          onClick={handleClose}
          disabled={Boolean(isSubmitting)}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3 text-rose-700">
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Annuler un versement
            </h2>
            <p className="text-xs text-slate-500">
              Confirmation de suppression du versement
            </p>
          </div>
        </div>

        {/* Versement Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{contribution.studentName}</span>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-700 shrink-0 ml-2">
              +{formatCurrency(contribution.amount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Date : <strong>{contribution.date}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Reçu : <strong>{contribution.receiptNumber}</strong></span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600">
            <span>Motif : </span>
            <span className="font-medium text-slate-800">{contribution.motif}</span>
            {contribution.paymentMethod && (
              <span className="text-slate-400"> ({contribution.paymentMethod})</span>
            )}
          </div>

          {contribution.projectName && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200 px-2 py-1 rounded-md">
              <Target className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Projet lié : <strong>{contribution.projectName}</strong></span>
            </div>
          )}
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl mb-4 flex items-start gap-2 text-xs text-rose-800">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Conséquence de l'annulation :</p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Le montant de <strong>{formatCurrency(contribution.amount)}</strong> sera définitivement soustrait du total de cet élève et du solde de la caisse{contribution.projectName ? ` ainsi que du projet ${contribution.projectName}` : ''}.
            </p>
          </div>
        </div>

        {/* Form with PIN */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Code PIN du comité pour valider l'annulation *
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
              required
              autoFocus
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tracking-widest focus:outline-none focus:border-rose-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-1.5 animate-in fade-in duration-100">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={Boolean(isSubmitting)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Conserver le versement
            </button>
            <button
              type="submit"
              disabled={Boolean(isSubmitting)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Annulation en cours...' : 'Confirmer l\'annulation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
