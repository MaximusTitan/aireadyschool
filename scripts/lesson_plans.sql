CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  chapter_topic TEXT NOT NULL,
  grade TEXT NOT NULL,
  board TEXT,
  class_duration INT NOT NULL,
  number_of_days INT NOT NULL,
  learning_objectives TEXT,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_lesson_plans_updated_at
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
