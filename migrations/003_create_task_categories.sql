CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES task_categories(id);
