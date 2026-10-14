import React, { useState, useEffect } from 'react';
import { Expense, Project, Contribution } from '../types';
import { verifyExpensePin } from '../utils/storage';
import { formatCurrency } from '../utils/grades';
import { X, Target, CheckCircle2, AlertCircle, Coins, Sparkles } from 'lucide-react';

interface AddExpenseSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  projects?: Project[];
  contributions?: Contribution[];
  expenses?: Expense[];
  preselectedProjectId?: string;
  initialMode?: 'standard' | 'partial_project' | 'full_project';
  onAddExpense: (expense: Omit<Expense, 'id'>, projectToMarkPaid?: string) => void;
}

export const AddExpenseSimpleModal: React.FC<AddExpenseSimpleModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  projects = [],
  contributions = [],
  expenses = [],
  preselectedProjectId,
  initialMode = 'standard',
  onAddExpense
}) => {
  const [expenseType, setExpenseType] = useState<'standard' | 'partial_project' | 'full_project'>(initialMode);
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

  // Handle initialization and preselected project
  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setExpenseType(initialMode);
      } else if (preselectedProjectId) {
        setExpenseType('partial_project');
      } else {
        setExpenseType('standard');
      }

      if (preselectedProjectId) {
        setSelectedProjectId(preselectedProjectId);
      } else {
        setSelectedProjectId('');
      }
      setAmountStr('');
      setMotif('');
      setPin('');
      setError('');
    }
  }, [isOpen, initialMode, preselectedProjectId]);

  // Helper to get stats for a project
  const getProjectStats = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return { proj: undefined, totalCollected: 0, totalWithdrawn: 0, remainingFunds: 0 };
    
    const totalCollected = contributions
      .filter(c => c.projectId === proj.id)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const totalWithdrawn = expenses
      .filter(e => e.projectId === proj.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const remainingFunds = Math.max(0, totalCollected - totalWithdrawn);
    return { proj, totalCollected, totalWithdrawn, remainingFunds };
  };

  const selectedStats = getProjectStats(selectedProjectId);
  const selectedProject = selectedStats.proj;
  const projectRemaining = selectedStats.remainingFunds;

  // React to project selection change or mode change
  useEffect(() => {
    if (!selectedProjectId) {
      if (expenseType !== 'standard') {
        setAmountStr('');
        setMotif('');
      }
      return;
    }

    const { proj, remainingFunds } = getProjectStats(selectedProjectId);
    if (proj) {
      if (expenseType === 'full_project') {
        setAmountStr(String(remainingFunds));
        setMotif(`Décaissement total projet : ${proj.name}`);
      } else if (expenseType === 'partial_project') {
        setMotif(`Retrait partiel projet : ${proj.name}`);
        if (!amountStr) {
          // Default empty so user types the partial amount
          setError('');
        }
      }
      setError('');
    }
  }, [expenseType, selectedProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      setError('Veuillez entrer un montant valide supérieur à 0 HTG.');
      return;
    }

    if (!motif.trim()) {
      setError('Veuillez préciser le motif de la dépense.');
      return;
    }

    // Constraint: Expense > available balance in caisse
    if (amount > availableBalance) {
      setError(
        `Dépense refusée : Le montant (${formatCurrency(amount)}) dépasse le solde disponible en caisse (${formatCurrency(availableBalance)}) !`
      );
      return;
    }

    // Validation for Partial Withdrawal
    if (expenseType === 'partial_project') {
      if (!selectedProject) {
        setError('Veuillez sélectionner un projet pour effectuer un retrait partiel.');
        return;
      }

      if (selectedProject.status === 'paid' && projectRemaining <= 0) {
        setError('Ce projet est déjà soldé et tous ses fonds ont été retirés.');
        return;
      }

      if (projectRemaining <= 0) {
        setError('Aucun fond disponible à retirer pour ce projet.');
        return;
      }

      if (amount > projectRemaining) {
        setError(
          `Montant invalide : Vous ne pouvez pas retirer plus que le solde disponible pour ce projet (${formatCurrency(projectRemaining)}).`
        );
        return;
      }
    }

    // Validation for Full Withdrawal (Clôture)
    if (expenseType === 'full_project') {
      if (!selectedProject) {
        setError('Veuillez sélectionner un projet terminé pour retirer la totalité de ses fonds.');
        return;
      }

      if (selectedProject.status === 'paid') {
        setError('Les fonds de ce projet ont déjà été retirés et le projet est marqué comme payé.');
        return;
      }

      if (selectedProject.status !== 'completed') {
        setError(
          'Impossible de retirer tous les fonds : Le projet doit obligatoirement être terminé avant la clôture définitive (cliquez sur "Mettre fin au projet" sur la carte du projet).'
        );
        return;
      }

      if (projectRemaining <= 0) {
        setError('Aucun fond n\'a été collecté ou restant pour ce projet (0 HTG).');
        return;
      }
    }

    // PIN check
    if (!verifyExpensePin(pin)) {
      setError('Code PIN incorrect.');
      return;
    }

    // Submit
    const isProjectLinked = expenseType === 'partial_project' || expenseType === 'full_project';
    const projectToMarkPaid = expenseType === 'full_project' ? selectedProject?.id : undefined;

    onAddExpense(
      {
        amount,
        date,
        motif: motif.trim(),
        category: isProjectLinked ? 'Événement' : 'Fournitures',
        authorizedBy: 'Comité NS1',
        pinVerified: true,
        projectId: isProjectLinked ? selectedProject?.id : undefined,
        projectName: isProjectLinked ? selectedProject?.name : undefined
      },
      projectToMarkPaid
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
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <span>💸</span>
          <span>Enregistrer une dépense</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Déduire un montant de la caisse de classe (Solde caisse : {formatCurrency(availableBalance)})
        </p>

        {/* 3-Way Mode Switcher */}
        <div className="mb-4 bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setExpenseType('standard');
              setSelectedProjectId('');
              setAmountStr('');
              setMotif('');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
              expenseType === 'standard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ordinaire
          </button>

          {/* Option à part : Retrait partiel projet */}
          <button
            type="button"
            onClick={() => {
              setExpenseType('partial_project');
              setAmountStr('');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center truncate ${
              expenseType === 'partial_project'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Retirer une partie des fonds sans clôturer le projet"
          >
            <Coins className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Retrait partiel</span>
          </button>

          {/* Retrait total projet (clôture) */}
          <button
            type="button"
            onClick={() => {
              setExpenseType('full_project');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center truncate ${
              expenseType === 'full_project'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Retirer tous les fonds d'un projet terminé et le solder"
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Retrait total</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          {/* MODE 1: Retrait partiel projet */}
          {expenseType === 'partial_project' && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <Coins className="w-4 h-4 text-indigo-600" />
                  <span>Sélectionner le projet (Retrait partiel) *</span>
                </label>
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  Sans clôturer le projet
                </span>
              </div>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required={expenseType === 'partial_project'}
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="">-- Choisir un projet avec fonds disponibles --</option>
                {projects.map((p) => {
                  const stats = getProjectStats(p.id);
                  const isPaid = p.status === 'paid';
                  const hasRemaining = stats.remainingFunds > 0;

                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={!hasRemaining}
                    >
                      {p.name} {hasRemaining ? `(${formatCurrency(stats.remainingFunds)} disponibles)` : '(0 HTG disponible / soldé)'}
                    </option>
                  );
                })}
              </select>

              {/* Explanatory summary for partial withdrawal */}
              {selectedProject && (
                <div className="bg-white/95 p-3 rounded-lg border border-indigo-200/90 text-[11px] text-slate-700 space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 pb-1.5 border-b border-slate-100 text-center">
                    <div className="bg-slate-50 p-1.5 rounded">
                      <div className="text-[10px] text-slate-400">Total collecté</div>
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {formatCurrency(selectedStats.totalCollected)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded">
                      <div className="text-[10px] text-slate-400">Déjà retiré</div>
                      <div className="font-mono font-bold text-rose-600 text-xs">
                        {formatCurrency(selectedStats.totalWithdrawn)}
                      </div>
                    </div>
                    <div className="bg-indigo-50/80 p-1.5 rounded border border-indigo-100">
                      <div className="text-[10px] text-indigo-700 font-semibold">Disponible</div>
                      <div className="font-mono font-bold text-indigo-700 text-xs">
                        {formatCurrency(selectedStats.remainingFunds)}
                      </div>
                    </div>
                  </div>

                  {/* Partial Withdrawal Quick-Fill Helper Buttons */}
                  <div className="pt-1">
                    <div className="text-[10px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Remplissage rapide du montant partiel :</span>
                      <span className="text-indigo-600 font-normal">Max : {formatCurrency(projectRemaining)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.25, 0.5, 0.75].map((pct) => {
                        const val = Math.round(projectRemaining * pct);
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setAmountStr(String(val));
                              if (error) setError('');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 rounded font-semibold text-[10px] transition-colors cursor-pointer"
                          >
                            {pct * 100}% ({val})
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setAmountStr(String(projectRemaining));
                          if (error) setError('');
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Tout ({projectRemaining})
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-900 bg-indigo-50/60 p-2 rounded-md font-medium border border-indigo-100 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      Ce retrait partiel déduit la somme de la caisse. Le projet <strong>restera ouvert</strong> et <strong>ne sera pas</strong> marqué comme payé.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Retrait total projet (clôture) */}
          {expenseType === 'full_project' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Target className="w-4 h-4 text-amber-700" />
                  <span>Sélectionner le projet terminé *</span>
                </label>
                <span className="text-[10px] font-normal text-amber-700">
                  (Projets terminés uniquement)
                </span>
              </div>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required={expenseType === 'full_project'}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-medium"
              >
                <option value="">-- Choisir un projet terminé à solder --</option>
                {projects.map((p) => {
                  const stats = getProjectStats(p.id);
                  const isCompleted = p.status === 'completed';
                  const isPaid = p.status === 'paid';

                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={!isCompleted || isPaid || stats.remainingFunds <= 0}
                    >
                      {isPaid 
                        ? `💰 ${p.name} (Déjà payé/soldé)` 
                        : isCompleted 
                          ? `✅ ${p.name} - ${formatCurrency(stats.remainingFunds)} restants` 
                          : `⏳ ${p.name} (En cours - terminez le projet d'abord)`}
                    </option>
                  );
                })}
              </select>

              {/* Explanatory notice */}
              {selectedProject && (
                <div className="bg-white/95 p-3 rounded-lg border border-amber-200/90 text-[11px] text-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Solde restant à décaisser :</span>
                    <strong className="font-mono text-emerald-700 text-xs font-bold">
                      {formatCurrency(selectedStats.remainingFunds)}
                    </strong>
                  </div>
                  {selectedStats.totalWithdrawn > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Déjà décaissé auparavant :</span>
                      <span className="font-mono text-rose-600 font-semibold">{formatCurrency(selectedStats.totalWithdrawn)}</span>
                    </div>
                  )}
                  {selectedProject.hasTarget && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Objectif initial :</span>
                      <span>{formatCurrency(selectedProject.targetAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold pt-1 border-t border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Après ce retrait total, le projet sera clôturé et marqué "💰 Payé"</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount and Date Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {expenseType === 'full_project' 
                  ? 'Fonds restants à solder (HTG)' 
                  : expenseType === 'partial_project' 
                    ? 'Montant partiel à retirer (HTG) *' 
                    : 'Montant (HTG) *'}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amountStr}
                readOnly={expenseType === 'full_project'}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError('');
                }}
                placeholder={expenseType === 'partial_project' ? `Ex: ${Math.min(500, projectRemaining || 500)}` : "Ex: 100"}
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 focus:outline-none ${
                  expenseType === 'full_project'
                    ? 'bg-slate-100 border-slate-300 font-mono font-bold cursor-not-allowed'
                    : expenseType === 'partial_project'
                      ? 'bg-white border-indigo-300 focus:border-indigo-600 font-mono font-bold'
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

          {/* Motif */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Motif de la dépense / décaissement *
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                if (error) setError('');
              }}
              placeholder={expenseType === 'partial_project' ? 'Ex: Acompte sono, achat matières...' : 'Ex: Achat maillots, photocopies, sono...'}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-rose-600"
            />
          </div>

          {/* PIN */}
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
              className={`px-4 py-2 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                expenseType === 'partial_project'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {expenseType === 'partial_project' ? (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  <span>Confirmer le retrait partiel</span>
                </>
              ) : expenseType === 'full_project' ? (
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
