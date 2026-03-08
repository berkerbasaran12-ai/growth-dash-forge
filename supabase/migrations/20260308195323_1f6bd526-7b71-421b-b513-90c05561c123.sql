
-- Client services table
CREATE TABLE public.client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  service_name text NOT NULL,
  description text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client services" ON public.client_services
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Client payments table
CREATE TABLE public.client_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  service_id uuid REFERENCES public.client_services(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  status text NOT NULL DEFAULT 'pending',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client payments" ON public.client_payments
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Clients can view own payments
CREATE POLICY "Clients can view own payments" ON public.client_payments
FOR SELECT TO authenticated USING (auth.uid() = client_user_id);

-- Clients can view own services
CREATE POLICY "Clients can view own services" ON public.client_services
FOR SELECT TO authenticated USING (auth.uid() = client_user_id);

-- Client notes table
CREATE TABLE public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client notes" ON public.client_notes
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
