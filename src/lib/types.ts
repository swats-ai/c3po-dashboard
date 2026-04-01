export interface Task {
  task_id: number;
  project_id: number;
  project_name: string;
  alias_email: string;
  subject: string;
  status: string;
  pm_agent_name: string;
  sender: string;
  attempts: number;
  staging_url: string | null;
  production_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  total_tasks: number;
  open_tasks: number;
  ongoing_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  escalated_tasks: number;
}
