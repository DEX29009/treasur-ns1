/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Student, Contribution, Expense, Project, UserRole } from './types';
import { 
  subscribeToStudents, 
  subscribeToContributions, 
  subscribeToExpenses, 
  subscribeToProjects, 
  addContributionToDB, 
  addExpenseToDB, 
  addProjectToDB, 
  updateProjectInDB,
  deleteProjectFromDB,
  resetAllDataInDB
} from './services/treasuryService';
import { getInitialStudents } from './data/studentsData';
import { getGradeForAmount, formatCurrency } from './utils/grades';
import { ProfileSelectionView } from './components/ProfileSelectionView';
import { PodiumSection } from './components/PodiumSection';
import { GradesTableSection } from './components/GradesTableSection';
import { ProjectsSection } from './components/ProjectsSection';
import { AddPaymentModal } from './components/AddPaymentModal';
import { AddExpenseSimpleModal } from './components/AddExpenseSimpleModal';
import { AddProjectModal } from './components/AddProjectModal';
import { EditProjectModal } from './components/EditProjectModal';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export default function App() {
  // Always prompt for profile on first load and on every visit
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isChangingProfile, setIsChangingProfile] = useState(false);

  // Real-time Cloud Firestore State
  const [students, setStudents] = useState<Student[]>(() => getInitialStudents());
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchStudent, setSearchStudent] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string | null>(null);

  // Modals
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>(undefined);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProjectToEdit, setSelectedProjectToEdit] = useState<Project | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  // Connect to Firestore real-time listeners across all devices
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) setIsLoading(false);
    };

    const unsubStudents = subscribeToStudents((data) => {
      setStudents(data);
      checkLoaded();
    });

    const unsubContributions = subscribeToContributions((data) => {
      setContributions(data);
      checkLoaded();
    });

    const unsubExpenses = subscribeToExpenses((data) => {
      setExpenses(data);
      checkLoaded();
    });

    const unsubProjects = subscribeToProjects((data) => {
      setProjects(data);
    });

    return () => {
      unsubStudents();
      unsubContributions();
      unsubExpenses();
      unsubProjects();
    };
  }, []);

  // Handle role selection (temporary for this session, asked every time)
  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.removeItem('tresorerie_ns1_role');
      localStorage.removeItem('tresorerie_ns1_role_v1');
    } catch {
      // ignore
    }
    setIsChangingProfile(false);
  };

  // Calculations
  const totalIn = useMemo(() => {
    return contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [contributions]);

  const totalOut = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const balance = useMemo(() => {
    return totalIn - totalOut;
  }, [totalIn, totalOut]);

  // Dynamically compute each student's total directly from contributions
  const studentsWithTotals = useMemo(() => {
    return students.map(student => {
      const studentContribs = contributions.filter(
        c => c.studentId === student.id || 
             (c.studentName && student.name && c.studentName.toLowerCase().trim() === student.name.toLowerCase().trim())
      );
      const sumFromContribs = studentContribs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const finalTotal = Math.max(Number(student.totalContributed || 0), sumFromContribs);
      return {
        ...student,
        totalContributed: finalTotal,
        contributionsCount: Math.max(student.contributionsCount || 0, studentContribs.length)
      };
    });
  }, [students, contributions]);

  // Sorted students list
  const sortedStudents = useMemo(() => {
    return [...studentsWithTotals].sort((a, b) => b.totalContributed - a.totalContributed);
  }, [studentsWithTotals]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchStudent.toLowerCase());
      if (!matchSearch) return false;

      if (selectedGradeFilter) {
        const grade = getGradeForAmount(student.totalContributed);
        if (grade.id !== selectedGradeFilter) return false;
      }

      return true;
    });
  }, [sortedStudents, searchStudent, selectedGradeFilter]);

  // Actions synchronized with Cloud Firestore
  const handleAddPayment = async (paymentData: Omit<Contribution, 'id' | 'receiptNumber'>) => {
    const student = studentsWithTotals.find(s => s.id === paymentData.studentId);
    if (!student) return;

    const receiptNumber = `REC-${String(contributions.length + 1).padStart(3, '0')}`;
    const newContribution: Contribution = {
      ...paymentData,
      id: `temp-${Date.now()}`,
      receiptNumber
    };

    // Optimistic instant UI update
    setContributions(prev => [newContribution, ...prev]);

    await addContributionToDB({
      ...paymentData,
      receiptNumber
    }, student);
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `temp-${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);
    await addExpenseToDB(expenseData);
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    await addProjectToDB({
      ...projectData,
      createdAt: `${dd}/${mm}/${yyyy}`
    });
  };

  const handleEditProject = (project: Project) => {
    setSelectedProjectToEdit(project);
    setIsEditProjectOpen(true);
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    await updateProjectInDB(projectId, updates);
  };

  const handleToggleProjectStatus = async (projectId: string, currentStatus: 'active' | 'completed') => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: nextStatus } : p));
    await updateProjectInDB(projectId, { status: nextStatus });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Voulez-vous supprimer ce projet ? Les versements enregistrés resteront conservés dans la caisse.')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      await deleteProjectFromDB(projectId);
    }
  };

  const handleResetToZero = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir remettre TOUTES les données à 0 sur TOUS les appareils ? Cette action effacera tous les versements, dépenses et projets de la base de données.')) {
      setIsLoading(true);
      await resetAllDataInDB();
      setContributions([]);
      setExpenses([]);
      setProjects([]);
      setIsLoading(false);
    }
  };

  // Show profile choice view if no role chosen or clicking "Changer de profil"
  if (!currentRole || isChangingProfile) {
    return (
      <ProfileSelectionView
        onSelectRole={handleSelectRole}
        onCancel={currentRole ? () => setIsChangingProfile(false) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Emerald Header */}
      <header className="bg-[#055b3f] text-white pt-6 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#044c34]">
        <div className="max-w-6xl mx-auto">
          {/* Top Bar: Title & Profile Info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest text-emerald-200 uppercase">
                  TRÉSORERIE · CLASSE NS1
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200 bg-[#044b34] px-1.5 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En direct
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                Caisse de la classe
              </h1>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-white">
                <span>{currentRole === 'committee' ? '🔑' : '👛'}</span>
                <span>{currentRole === 'committee' ? 'Membre du comité' : 'Élève'}</span>
              </div>
              <button
                onClick={() => {
                  setCurrentRole(null);
                  setIsChangingProfile(true);
                }}
                className="text-[11px] text-emerald-200 hover:text-white underline mt-0.5 transition-colors cursor-pointer"
              >
                Changer de profil
              </button>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
            <div className="bg-[#044b34]/90 rounded-xl p-4 border border-emerald-600/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                SOLDE DE LA CLASSE
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {formatCurrency(balance)}
              </div>
            </div>

            <div className="bg-[#044b34]/90 rounded-xl p-4 border border-emerald-600/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                TOTAL ENCAISSÉ
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {formatCurrency(totalIn)}
              </div>
            </div>

            <div className="bg-[#044b34]/90 rounded-xl p-4 border border-emerald-600/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                TOTAL DÉPENSÉ
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {formatCurrency(totalOut)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {/* Piédestal des 3 meilleurs donateurs (avec grades 1er, 2ème, 3ème) */}
        <PodiumSection students={studentsWithTotals} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Élèves List */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Élèves ({studentsWithTotals.length})
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-36 sm:w-44 px-2.5 py-1 text-xs border border-slate-200 rounded-lg placeholder-slate-400 text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {selectedGradeFilter && (
              <div className="mb-2.5 flex items-center justify-between text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                <span>Filtre de grade actif</span>
                <button
                  onClick={() => setSelectedGradeFilter(null)}
                  className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  Effacer
                </button>
              </div>
            )}

            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredStudents.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  Aucun élève trouvé.
                </div>
              ) : (
                filteredStudents.map((student, idx) => {
                  const grade = getGradeForAmount(student.totalContributed);
                  const rankNumber = idx + 1;

                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        if (currentRole === 'committee') {
                          setPreselectedStudentId(student.id);
                          setIsAddPaymentOpen(true);
                        }
                      }}
                      className={`py-2.5 flex items-center justify-between gap-2 text-xs transition-colors ${
                        currentRole === 'committee' ? 'hover:bg-slate-50 cursor-pointer' : ''
                      }`}
                      title={currentRole === 'committee' ? `Cliquer pour ajouter un versement pour ${student.name}` : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[11px] text-slate-400 w-5 shrink-0 text-right font-medium">
                          {rankNumber}.
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {student.name}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                          student.totalContributed > 0
                            ? grade.badgeColor
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <span>{grade.emoji}</span>
                          <span>{grade.name}</span>
                        </span>
                      </div>

                      <div className="text-right shrink-0 font-bold text-slate-900 font-mono">
                        {formatCurrency(student.totalContributed)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Versements and Dépenses */}
          <div className="lg:col-span-7 space-y-6">
            {/* Versements Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Versements
                </h2>
                {currentRole === 'committee' && (
                  <button
                    onClick={() => {
                      setPreselectedStudentId(undefined);
                      setIsAddPaymentOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouveau versement</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {contributions.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6">
                    Aucun versement enregistré.
                  </div>
                ) : (
                  contributions.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="font-bold text-slate-900 truncate">
                          {c.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{c.date} · {c.motif}</span>
                          {c.projectName && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                              🎯 {c.projectName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-600 font-mono text-sm shrink-0">
                        +{formatCurrency(c.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dépenses Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Dépenses
                </h2>
                {currentRole === 'committee' && (
                  <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Nouvelle dépense</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {expenses.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">
                    Aucune dépense enregistrée.
                  </div>
                ) : (
                  expenses.map((e) => (
                    <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {e.motif}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {e.date} · {e.authorizedBy || 'Comité NS1'}
                        </div>
                      </div>
                      <div className="font-bold text-rose-600 font-mono text-sm">
                        -{formatCurrency(e.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projets de la classe Section */}
        <div className="mt-6">
          <ProjectsSection
            projects={projects}
            contributions={contributions}
            currentRole={currentRole}
            onOpenAddProject={() => setIsAddProjectOpen(true)}
            onEditProject={handleEditProject}
            onToggleProjectStatus={handleToggleProjectStatus}
          />
        </div>

        {/* Tableau des grades Section */}
        <GradesTableSection
          students={studentsWithTotals}
          selectedGradeId={selectedGradeFilter}
          onFilterByGrade={(gradeId) => setSelectedGradeFilter(gradeId)}
        />
      </main>

      {/* Footer with Reset to 0 Option */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Trésorerie NS1 · Synchronisée en temps réel via base de données Cloud</span>
          {currentRole === 'committee' && (
            <button
              onClick={handleResetToZero}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remettre toutes les données à 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser la base à 0</span>
            </button>
          )}
        </div>
      </footer>

      {/* Modals */}
      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        students={studentsWithTotals}
        projects={projects}
        preselectedStudentId={preselectedStudentId}
        onAddPayment={handleAddPayment}
      />

      <AddExpenseSimpleModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        availableBalance={balance}
        onAddExpense={handleAddExpense}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onAddProject={handleAddProject}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setSelectedProjectToEdit(null);
        }}
        project={selectedProjectToEdit}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
}
