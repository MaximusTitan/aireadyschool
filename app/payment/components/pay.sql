-- Subscription Plans table
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  price INTEGER NOT NULL,
  price_display TEXT NOT NULL,
  credits JSONB NOT NULL,
  description TEXT,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, type, price, price_display, credits, features)
VALUES 
  (
    'student_plan', 
    'Student', 
    99900, 
    'Rs.999.00 per month', 
    '{"videos": 25, "images": 500, "text": "Unlimited"}',
    '["Access to all AI tools", "Priority support", "Cancel anytime"]'
  ),
  (
    'teacher_plan', 
    'Teacher', 
    199900, 
    'Rs.1999.00 per month', 
    '{"videos": 50, "images": 500, "text": "Unlimited"}',
    '["Access to all AI tools", "Priority support", "Cancel anytime", "Team collaboration"]'
  );

-- User Subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meta_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Create index on status for filtering
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Payment History table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create RLS policies for security

-- Subscription plans are readable by all authenticated users
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription plans are viewable by all users" 
  ON subscription_plans FOR SELECT 
  USING (auth.role() = 'authenticated');

-- User subscriptions are only readable by the owning user or admins
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions" 
  ON user_subscriptions FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.role() = 'service_role'
  ));

-- Payment history is only readable by the owning user or admins
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payment history" 
  ON payment_history FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE auth.role() = 'service_role'
  ));

-- Create view for active subscriptions with plan details
CREATE VIEW active_subscriptions AS
SELECT 
  us.*,
  sp.type as plan_type,
  sp.price as plan_price,
  sp.price_display as plan_price_display,
  sp.credits as plan_credits,
  sp.features as plan_features
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active' AND us.end_date > CURRENT_TIMESTAMP;
