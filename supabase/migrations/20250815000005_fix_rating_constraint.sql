-- Fix rating constraint in feedback_responses table
-- The original constraint limited rating to 1-10, but the system needs 1-100 for supervisors

-- Drop the existing constraint
ALTER TABLE public.feedback_responses 
DROP CONSTRAINT IF EXISTS feedback_responses_rating_check;

-- Add new constraint that allows rating 1-100
ALTER TABLE public.feedback_responses 
ADD CONSTRAINT feedback_responses_rating_check 
CHECK (rating >= 1 AND rating <= 100);

-- Update comment to reflect the change
COMMENT ON COLUMN public.feedback_responses.rating IS 'Rating value: 1-100 for supervisors, 71-90 for regular users (validation handled in application)';
