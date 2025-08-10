export type Task = {
  id: string; title: string; description: string | null;
  category_id: string | null; priority: 'low'|'medium'|'high'|'urgent';
  status_select: 'inactive'|'active'|'completed';
  created_at: string; activated_at: string | null; completed_at: string | null; updated_at: string;
  category_name?: string | null;
}
