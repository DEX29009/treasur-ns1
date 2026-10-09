import React, { useState, useEffect } from 'react';
import { Expense, Project, Contribution } from '../types';
import { verifyExpensePin } from '../utils/storage';
import { formatCurrency } from '../utils/grades';
import { X, Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddExpenseSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  projects?: Project[];
  contributions?: Contribution[];
  preselectedProjectId?: string;
  onAddExpense: (expense: Omit<Expense, 'id'>, projectToMarkPaid?: string) => void;
}

export const AddExpenseSimpleModal: React.FC<AddExpenseSimpleModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  projects = [],
  contributions = [],
  preselectedProjectId,
  onAddExpense
}) => {
  const [expenseType, setExpenseType] = useState<'standard' | 'project'>('standard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
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

  // Handle preselected project
  useEffect(() => {
    if (preselectedProjectId) {
      setExpenseType('project');
      setSelectedProjectId(preselectedProjectId);
    } else {
      setSelectedProjectId('');
    }
  }, [preselectedProjectId, isOpen]);

  // When selected project changes in 'project' mode, auto-fill amount with all collected funds
  useEffect(() => {
    if (expenseType === 'project' && selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        const projectContributions = contributions.filter(c => c.projectId === proj.id);
        const totalCollected = projectContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        setAmountStr(String(totalCollected));
        setMotif(`Décaissement projet : ${proj.name}`);
        setError('');
      }
    }
  }, [expenseType, selectedProjectId, projects, contributions]);

  if (!isOpen) return null;

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProjectCollected = selectedProject
    ? contributions.filter(c => c.projectId === selectedProject.id).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);

    if (amount === undefined || isNaN(amount) || amount < 0) {
      setError('Veuillez entrer un montant valide supérieur ou égal à 0.');
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

    // Validation for project withdrawal
    if (expenseType === 'project') {
      if (!selectedProject) {
        setError('Veuillez sélectionner un projet terminé pour retirer ses fonds.');
        return;
      }

      if (selectedProject.status === 'paid') {
        setError('Les fonds de ce projet ont déjà été retirés et marqués comme payés.');
        return;
      }

      if (selectedProject.status !== 'completed') {
        setError(
          'Impossible de retirer les fonds : Le projet doit obligatoirement être terminé avant de décaisser (cliquez sur "Mettre fin au projet" sur la carte du projet).'
        );
        return;
      }

      if (selectedProjectCollected <= 0) {
        setError('Aucun fond n\'a été collecté pour ce projet (0 HTG).');
        return;
      }
    }

    // Constraint: PIN check without revealing answer
    if (!verifyExpensePin(pin)) {
      setError('Code PIN incorrect.');
      return;
    }

    onAddExpense(
      {
        amount,
        date,
        motif: motif.trim(),
        category: expenseType === 'project' ? 'Événement' : 'Fournitures',
        authorizedBy: 'Comité NS1',
        pinVerified: true,
        projectId: expenseType === 'project' ? selectedProject?.id : undefined,
        projectName: expenseType === 'project' ? selectedProject?.name : undefined
      },
      expenseType === 'project' ? selectedProject?.id : undefined
    );

    setAmountStr('');
    setMotif('');
    setPin('');
    setSelectedProjectId('');
    setExpenseType('standard');
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

        {/* Expense Type Switcher */}
        <div className="mb-4 bg-slate-100 p-1 rounded-xl flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setExpenseType('standard');
              setSelectedProjectId('');
              setAmountStr('');
              setMotif('');
              setError('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
              expenseType === 'standard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dépense ordinaire
          </button>
          <button
            type="button"
            onClick={() => {
              setExpenseType('project');
              setError('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              expenseType === 'project'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Retirer fonds projet</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          {/* Project Selection in Project Mode */}
          {expenseType === 'project' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <label className="block font-bold text-amber-900 flex items-center justify-between">
                <span>Sélectionner le projet terminé *</span>
                <span className="text-[10px] font-normal text-amber-700">
                  (Seuls les projets terminés sont autorisés)
                </span>
              </label>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required={expenseType === 'project'}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              >
                <option value="">-- Choisir un projet terminé --</option>
                {projects.map((p) => {
                  const collected = contributions
                    .filter(c => c.projectId === p.id)
                    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const isCompleted = p.status === 'completed';
                  const isPaid = p.status === 'paid';

                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={!isCompleted || isPaid || collected <= 0}
                    >
                      {isPaid 
                        ? `💰 ${p.name} (Déjà payé)` 
                        : isCompleted 
                          ? `✅ ${p.name} - ${formatCurrency(collected)} collectés` 
                          : `⏳ ${p.name} (En cours - terminez le projet d'abord)`}
                    </option>
                  );
                })}
              </select>

              {/* Explanatory notice */}
              {selectedProject && (
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-slate-700 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total collecté à retirer :</span>
                    <strong className="font-mono text-emerald-700 text-xs">
                      {formatCurrency(selectedProjectCollected)}
                    </strong>
                  </div>
                  {selectedProject.hasTarget && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Objectif initial :</span>
                      <span>{formatCurrency(selectedProject.targetAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold pt-1 border-t border-slate-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Après ce retrait, le projet sera marqué "💰 Payé"</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {expenseType === 'project' ? 'Fonds à décaisser (HTG)' : 'Montant (HTG)'}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amountStr}
                readOnly={expenseType === 'project'}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: 100"
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 focus:outline-none ${
                  expenseType === 'project'
                    ? 'bg-slate-100 border-slate-300 font-mono font-bold cursor-not-allowed'
                    : 'bg-white border-slate-200 focus:border-rose-600'
                }`}
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
              placeholder="Ex: Achat maillots, photocopies, sono..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
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
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 tracking-widest focus:outline-none focus:border-rose-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
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
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              {expenseType === 'project' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Décaisser et marquer payé</span>
                </>
              ) : (
                <span>Confirmer la dépense</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
