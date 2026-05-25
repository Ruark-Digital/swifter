import React from "react";
import { SEOWrapper } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Share2, Plus } from "lucide-react";
import StatsCards from "./components/StatsCards";
import EmptyState from "./components/EmptyState";
import CreateProjectDialog from "./components/CreateProjectDialog";
import SuccessAlert from "./components/SuccessAlert";
import ProjectsTable from "./components/ProjectsTable";
import {
  useProjectsList,
  useProjectsStats,
  useCreateProject,
} from "./services/useProjectApi";
import { formatDateTZ } from "@/lib/utils";

const ProjectManagementPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);
  const [lastCreatedProjectId, setLastCreatedProjectId] = React.useState<
    string | null
  >(null);
  const [detailsProjectId, setDetailsProjectId] = React.useState<string | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const { data: listRes, isLoading: isListLoading } = useProjectsList({
    page: 1,
    limit: 10,
  });
  const { data: statsRes } = useProjectsStats();
  const createProject = useCreateProject();

  const handleCreateClick = () => setIsCreateOpen(true);
  const handleSuccess = () => setIsSuccessOpen(true);

  const rows = (listRes?.data ?? []).map((p) => ({
    id: p._id,
    name: p.name,
    budget:
      typeof p.budget === "number"
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
          }).format(p.budget)
        : undefined,
    startDate: p.startDate ? formatDateTZ(p.startDate, "yyyy-MM-dd") : undefined,
    endDate: p.endDate ? formatDateTZ(p.endDate, "yyyy-MM-dd") : undefined,
    status: p.status,
  }));

  return (
    <div className="space-y-8 pt-10">
      <SEOWrapper
        title="Project Management - SwiftPro eProcurement Portal"
        description="Manage projects efficiently. Create, track active work, and review completed tasks."
        canonical="/dashboard/project-management"
        robots="noindex, nofollow"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
        <div className="flex items-center gap-4">
          <Button
            data-testid="export-button"
            variant="outline"
            aria-label="Export projects"
            className="rounded-xl"
          >
            <Share2 className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            data-testid="create-project-button"
            aria-label="Create Project"
            className="rounded-xl"
            onClick={handleCreateClick}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </div>
      </div>

      <StatsCards
        counts={{
          all: statsRes?.data?.all ?? 0,
          active: statsRes?.data?.active ?? 0,
          completed: statsRes?.data?.completed ?? 0,
        }}
      />

      {isListLoading ? (
        <div className="p-10 text-center text-slate-600 dark:text-slate-400">Loading projects…</div>
      ) : rows.length > 0 ? (
        <ProjectsTable
          projects={rows}
          detailsProjectId={detailsProjectId}
          detailsOpen={isDetailsOpen}
          onDetailsProjectIdChange={setDetailsProjectId}
          onDetailsOpenChange={setIsDetailsOpen}
        />
      ) : (
        <EmptyState handleCreateClick={handleCreateClick} />
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleSuccess}
        isSubmitting={createProject.isPending}
        onSubmit={async (form) => {
          const res = await createProject.mutateAsync({
            name: form.name,
            category: form.category,
            description: form.description,
            startDate: form.startDate,
            endDate: form.endDate,
            budget: form.budget ?? 0,
            allowMultiple: form.allowMultipleContracts,
            files: form.files,
            businessDivision: form.businessDivision,
          });

          setLastCreatedProjectId(res.data?._id ?? null);
        }}
      />

      <SuccessAlert
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        onViewDetails={() => {
          if (!lastCreatedProjectId) return;
          setDetailsProjectId(lastCreatedProjectId);
          setIsDetailsOpen(true);
        }}
      />
    </div>
  );
};

export default ProjectManagementPage;
