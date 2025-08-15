-- supabase/migrations/20250815000004_add_period_completion_tracking.sql

-- Add completion tracking fields to assessment_periods table
ALTER TABLE public.assessment_periods 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add completion tracking fields to assessment_assignments table
ALTER TABLE public.assessment_assignments 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to mark period as completed
CREATE OR REPLACE FUNCTION public.mark_period_completed(period_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Update period status
  UPDATE public.assessment_periods 
  SET 
    is_active = false,
    is_completed = true,
    completed_at = now(),
    end_date = now()::date
  WHERE id = period_uuid;
  
  -- Mark all incomplete assignments as completed
  UPDATE public.assessment_assignments 
  SET 
    is_completed = true,
    completed_at = now()
  WHERE period_id = period_uuid AND is_completed = false;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance on completion queries
CREATE INDEX IF NOT EXISTS idx_assessment_periods_completion 
ON public.assessment_periods(is_completed, completed_at);

CREATE INDEX IF NOT EXISTS idx_assessment_assignments_completion 
ON public.assessment_assignments(period_id, is_completed, completed_at);
