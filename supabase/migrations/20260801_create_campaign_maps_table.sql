-- Create campaign_maps table
CREATE TABLE IF NOT EXISTS public.campaign_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add associated_map_id column to scenes if it does not exist
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS associated_map_id UUID REFERENCES public.campaign_maps(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and write campaign_maps (aligned with database strategy)
CREATE POLICY "Allow all operations for authenticated users on campaign_maps"
ON public.campaign_maps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
