-- Create scene_maps table
CREATE TABLE IF NOT EXISTS public.scene_maps (
    scene_id UUID PRIMARY KEY REFERENCES public.scenes(id) ON DELETE CASCADE,
    grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scene_maps ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and write scene_maps for now
CREATE POLICY "Allow all operations for authenticated users"
ON public.scene_maps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
