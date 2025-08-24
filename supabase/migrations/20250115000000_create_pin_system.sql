-- Migration: Create Pin System
-- Date: 2025-01-15

-- Create employee_pins table
CREATE TABLE IF NOT EXISTS employee_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_pin_allowance table
CREATE TABLE IF NOT EXISTS weekly_pin_allowance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  pins_remaining INTEGER DEFAULT 4,
  pins_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_pins_week_year ON employee_pins(week_number, year);
CREATE INDEX IF NOT EXISTS idx_employee_pins_month_year ON employee_pins(month, year);
CREATE INDEX IF NOT EXISTS idx_employee_pins_giver ON employee_pins(giver_id);
CREATE INDEX IF NOT EXISTS idx_employee_pins_receiver ON employee_pins(receiver_id);
CREATE INDEX IF NOT EXISTS idx_weekly_pin_allowance_user_week_year ON weekly_pin_allowance(user_id, week_number, year);

-- Create functions for getting week, year, and month numbers
CREATE OR REPLACE FUNCTION get_week_number(date_input DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(WEEK FROM date_input);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_year_from_timestamp(timestamp_input TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM timestamp_input::DATE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_month_from_timestamp(timestamp_input TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(MONTH FROM timestamp_input::DATE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_week_number()
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(WEEK FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_year()
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_month()
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(MONTH FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for employee_pins table
ALTER TABLE employee_pins ENABLE ROW LEVEL SECURITY;

-- Users can view all pins (for rankings)
CREATE POLICY "Users can view all pins" ON employee_pins
  FOR SELECT USING (true);

-- Users can only insert pins for themselves
CREATE POLICY "Users can only give pins" ON employee_pins
  FOR INSERT WITH CHECK (auth.uid() = giver_id);

-- Users can only update pins they gave
CREATE POLICY "Users can only update their own pins" ON employee_pins
  FOR UPDATE USING (auth.uid() = giver_id);

-- Users can only delete pins they gave
CREATE POLICY "Users can only delete their own pins" ON employee_pins
  FOR DELETE USING (auth.uid() = giver_id);

-- Create RLS policies for weekly_pin_allowance table
ALTER TABLE weekly_pin_allowance ENABLE ROW LEVEL SECURITY;

-- Users can only view their own allowance
CREATE POLICY "Users can only view their own allowance" ON weekly_pin_allowance
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert allowance for themselves
CREATE POLICY "Users can only create their own allowance" ON weekly_pin_allowance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own allowance
CREATE POLICY "Users can only update their own allowance" ON weekly_pin_allowance
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own allowance
CREATE POLICY "Users can only delete their own allowance" ON weekly_pin_allowance
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically set week_number, year, and month when inserting pins
CREATE OR REPLACE FUNCTION set_pin_period_info()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week_number := get_week_number(NEW.given_at::DATE);
  NEW.year := get_year_from_timestamp(NEW.given_at);
  NEW.month := get_month_from_timestamp(NEW.given_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_pin_period_info
  BEFORE INSERT ON employee_pins
  FOR EACH ROW
  EXECUTE FUNCTION set_pin_period_info();

-- Create function to initialize weekly allowance for all users
CREATE OR REPLACE FUNCTION initialize_weekly_allowance()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  current_week INTEGER;
  current_year INTEGER;
BEGIN
  current_week := get_current_week_number();
  current_year := get_current_year();
  
  -- Loop through all profiles (excluding admins)
  FOR user_record IN 
    SELECT p.id 
    FROM profiles p
    LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'admin'
    WHERE ur.user_id IS NULL
  LOOP
    -- Insert allowance if it doesn't exist
    INSERT INTO weekly_pin_allowance (user_id, week_number, year, pins_remaining, pins_used)
    VALUES (user_record.id, current_week, current_year, 4, 0)
    ON CONFLICT (user_id, week_number, year) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON employee_pins TO authenticated;
GRANT ALL ON weekly_pin_allowance TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
