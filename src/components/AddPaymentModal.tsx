import React, { useState } from 'react';
import { Student, Contribution, Project } from '../types';
import { formatCurrency } from '../utils/grades';
import { X, CheckCircle2 } from 'lucide-react';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  projects: Project[];
  preselectedStudentId?: string;
  onAddPayment: (payment: Omit<Contribution, 'id' | 'receiptNumber'>) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  students,
  projects,
  preselectedStudentId,
  onAddPayment
}) => {
  const [studentId, setStudentId] = useState(preselectedStudentId || students[0]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [motif, setMotif] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [error, setError] = useState('');
  
  // Step 1: 'form', Step 2: 'confirm'
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  React.useEffect(() => {
    if (preselectedStudentId) {
      setStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  // Reset step when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setError('');
      setSelectedProjectId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedStudent = students.find(s => s.id === studentId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const amount = parseFloat(amountStr) || 0;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || amount <= 0) {
      setError('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    if (!motif.trim()) {
      setError('Veuillez préciser le motif du versement.');
      return;
    }

    if (!selectedStudent) {
      setError('Élève introuvable.');
      return;
    }

    // Go to confirmation step
    setStep('confirm');
  };

  const handleFinalConfirm = () => {
    if (!selectedStudent || amount <= 0) return;

    onAddPayment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      amount,
      date,
      motif: motif.trim(),
      paymentMethod: 'Espèces',
      recordedBy: 'Comité NS1',
      projectId: selectedProject?.id,
      projectName: selectedProject?.name
    });

    setAmountStr('');
    setMotif('');
    setSelectedProjectId('');
    setError('');
    setStep('form');
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

        {step === 'form' ? (
          <>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Enregistrer un versement
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Ajouter de l'argent versé par un élève de NS1
            </p>

            <form onSubmit={handleNextStep} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Élève
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

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
                    placeholder="Ex: 150"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif du versement
                </label>
                <input
                  type="text"
                  value={motif}
                  onChange={(e) => {
                    setMotif(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ex: Cotisation, Maillots, Projet"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Link to a Project: Oui ou Non */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Relier à un projet spécifique ? (Optionnel)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Non (Caisse générale de la classe)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      🎯 {p.name} {p.hasTarget && p.targetAmount ? `(Objectif : ${p.targetAmount} HTG)` : '(Sans objectif)'}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Aucun projet créé pour l'instant. Vous pouvez créer des projets depuis la caisse.
                  </p>
                )}
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
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Continuer
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Step 2: Confirmation Screen */
          <div className="text-left animate-in fade-in duration-150">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h2 className="text-base font-bold text-slate-900">
                Confirmer le versement
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Veuillez vérifier les informations avant d'enregistrer :
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs mb-4">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Élève :</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedStudent?.name}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Montant :</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  +{formatCurrency(amount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Motif :</span>
                <span className="font-medium text-slate-800 text-right">
                  {motif}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Projet relié :</span>
                <span className="font-semibold text-slate-800">
                  {selectedProject ? `🎯 ${selectedProject.name}` : 'Non (Caisse générale)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Date :</span>
                <span className="font-semibold text-slate-800">
                  {date}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ← Modifier
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Confirmer le versement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
