import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data: campaigns, error: campErr } = await supabase.from('campaigns').select('*');
    const { data: sessions, error: sessErr } = await supabase.from('sessions').select('*');
    const { data: scenes, error: sceneErr } = await supabase.from('scenes').select('*');
    const { data: { session } } = await supabase.auth.getSession();

    return NextResponse.json({
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      sessionUser: session?.user ? { id: session.user.id, email: session.user.email } : null,
      campaigns: { count: campaigns?.length || 0, error: campErr, data: campaigns },
      sessions: { count: sessions?.length || 0, error: sessErr, data: sessions },
      scenes: { count: scenes?.length || 0, error: sceneErr, data: scenes },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
