-- Create bills table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_name TEXT,
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill items table
CREATE TABLE public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill people table
CREATE TABLE public.bill_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create item assignments table (which person pays for which item, with split percentage)
CREATE TABLE public.item_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_item_id UUID NOT NULL REFERENCES public.bill_items(id) ON DELETE CASCADE,
  bill_person_id UUID NOT NULL REFERENCES public.bill_people(id) ON DELETE CASCADE,
  split_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bill_item_id, bill_person_id)
);

-- Enable RLS on all tables (keeping them public for now since no auth required)
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this feature)
CREATE POLICY "Allow all access to bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to bill_items" ON public.bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to bill_people" ON public.bill_people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to item_assignments" ON public.item_assignments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for bill images
INSERT INTO storage.buckets (id, name, public) VALUES ('bill-images', 'bill-images', true);

-- Create storage policies
CREATE POLICY "Public read access to bill images" ON storage.objects FOR SELECT USING (bucket_id = 'bill-images');
CREATE POLICY "Allow uploads to bill images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bill-images');
CREATE POLICY "Allow updates to bill images" ON storage.objects FOR UPDATE USING (bucket_id = 'bill-images');
CREATE POLICY "Allow deletes from bill images" ON storage.objects FOR DELETE USING (bucket_id = 'bill-images');