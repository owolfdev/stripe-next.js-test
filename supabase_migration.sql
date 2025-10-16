-- Create the user-stripe mapping table
CREATE TABLE stripe_test_user_stripe_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX idx_stripe_test_user_stripe_mapping_user_id ON stripe_test_user_stripe_mapping(user_id);
CREATE INDEX idx_stripe_test_user_stripe_mapping_stripe_customer_id ON stripe_test_user_stripe_mapping(stripe_customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE stripe_test_user_stripe_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own mapping
CREATE POLICY "Users can view own stripe mapping" ON stripe_test_user_stripe_mapping
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own mapping
CREATE POLICY "Users can insert own stripe mapping" ON stripe_test_user_stripe_mapping
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own mapping
CREATE POLICY "Users can update own stripe mapping" ON stripe_test_user_stripe_mapping
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_stripe_test_user_stripe_mapping_updated_at
  BEFORE UPDATE ON stripe_test_user_stripe_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON stripe_test_user_stripe_mapping TO authenticated;
GRANT ALL ON stripe_test_user_stripe_mapping TO service_role;
