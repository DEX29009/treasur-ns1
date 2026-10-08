import React, { useState } from 'react';
import { Expense } from '../types';
import { verifyExpensePin } from '../utils/storage';
import { formatCurrency } from '../utils/grades';
import { X } from 'lucide-react';

interface AddExpenseSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const AddExpenseSimpleModal: React.FC<AddExpenseSimpleModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onAddExpense
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [motif, setMotif] = useState('');
  const [pin, setPin] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);

    if (!amount || amount <= 0) {
      setError('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    if (!motif.trim()) {
      setError('Veuillez préciser le motif de la dépense.');
      return;
    }

    // Constraint: Expense > available balance
    if (amount > availableBalance) {
      setError(
        `Dépense refusée : Le montant (${formatCurrency(amount)}) dépasse le solde disponible en caisse (${formatCurrency(availableBalance)}) !`
      );
      return;
    }

    // Constraint: PIN check without revealing answer
    if (!verifyExpensePin(pin)) {
      setError('Code PIN incorrect.');
      return;
    }

    onAddExpense({
      amount,
      date,
      motif: motif.trim(),
      category: 'Fournitures',
      authorizedBy: 'Comité NS1',
      pinVerified: true
    });

    setAmountStr('');
    setMotif('');
    setPin('');
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

        <h2 className="text-base font-bold text-slate-900 mb-1">
          Enregistrer une dépense
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Déduire un montant de la caisse de classe (Solde : {formatCurrency(availableBalance)})
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Montant (HTG)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: 100"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date (JJ/MM/AAAA)
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motif de la dépense
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Achat de marqueurs pour tableau"
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Code PIN de confirmation
            </label>
            <input
              type="password"
              value={pin}
              maxLength={6}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="Entrez le code PIN"
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600 tracking-wider font-mono"
            />
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              Valider la dépense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
