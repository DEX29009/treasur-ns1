import React from 'react';
import { Project, Contribution, UserRole } from '../types';
import { formatCurrency } from '../utils/grades';
import { Target, Plus, Pencil, CheckCircle2, RotateCcw, Calendar, Flag } from 'lucide-react';

interface ProjectsSectionProps {
  projects: Project[];
  contributions: Contribution[];
  currentRole: UserRole | null;
  onOpenAddProject: () => void;
  onEditProject: (project: Project) => void;
  onToggleProjectStatus: (projectId: string, currentStatus: 'active' | 'completed') => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  contributions,
  currentRole,
  onOpenAddProject,
  onEditProject,
  onToggleProjectStatus
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🎯</span>
            <span>Projets de la classe</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cagnottes, objectifs financiers et échéances de la promotion
          </p>
        </div>

        {currentRole === 'committee' && (
          <button
            onClick={onOpenAddProject}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau projet</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
          <p>Aucun projet spécifique créé pour l'instant.</p>
          {currentRole === 'committee' && (
            <button
              onClick={onOpenAddProject}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              + Créer un premier projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {projects.map((project) => {
            // Calculate total collected for this project
            const projectContributions = contributions.filter(c => c.projectId === project.id);
            const totalCollected = projectContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

            const hasTarget = Boolean(project.hasTarget && project.targetAmount && project.targetAmount > 0);
            const targetAmount = project.targetAmount || 0;
            const progressPercent = hasTarget ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;
            const isTargetReached = hasTarget && totalCollected >= targetAmount;
            const isCompleted = project.status === 'completed';

            return (
              <div
                key={project.id}
                className={`p-3.5 border rounded-xl space-y-2 relative transition-all ${
                  isCompleted 
                    ? 'bg-slate-100/70 border-slate-300 opacity-90' 
                    : 'bg-slate-50/70 border-slate-200/90'
                }`}
              >
                {/* Header with Title and Committee Actions (Pencil & End Project button) */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {project.name}
                      </h3>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-slate-600" />
                          <span>Projet terminé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-300/80">
                          <span>En cours</span>
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Top-right Committee Actions: Pencil (crayon) & End Project */}
                  {currentRole === 'committee' && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Button to End / Reopen Project */}
                      <button
                        type="button"
                        onClick={() => onToggleProjectStatus(project.id, project.status || 'active')}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          isCompleted
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-slate-100'
                            : 'text-rose-600 hover:text-rose-800 hover:bg-rose-100 bg-rose-50'
                        }`}
                        title={isCompleted ? 'Rouvrir le projet' : 'Mettre fin au projet'}
                      >
                        {isCompleted ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : (
                          <Flag className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] hidden sm:inline">
                          {isCompleted ? 'Rouvrir' : 'Mettre fin'}
                        </span>
                      </button>

                      {/* Pencil Icon (Crayon en haut a droite pour modifier) */}
                      <button
                        type="button"
                        onClick={() => onEditProject(project)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                        title="Modifier le projet"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Deadline (Date limite) display if set */}
                {project.deadline && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200 px-2 py-0.5 rounded-md w-fit">
                    <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Date limite : <strong>{project.deadline}</strong></span>
                  </div>
                )}

                {/* Financial figures */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-500">Collecté : </span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      {formatCurrency(totalCollected)}
                    </span>
                  </div>

                  {hasTarget ? (
                    <div className="text-xs text-slate-600">
                      Objectif : <span className="font-mono font-semibold">{formatCurrency(targetAmount)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded font-medium">
                      Sans objectif fixe
                    </span>
                  )}
                </div>

                {/* Progress bar if has target */}
                {hasTarget && (
                  <div className="space-y-1 pt-0.5">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isTargetReached ? 'bg-emerald-600' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{progressPercent}% réalisé</span>
                      {isTargetReached ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Objectif atteint !
                        </span>
                      ) : (
                        <span>Reste {formatCurrency(Math.max(0, targetAmount - totalCollected))}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-200/50 flex justify-between">
                  <span>{projectContributions.length} versement(s) lié(s)</span>
                  <span>Créé le {project.createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
