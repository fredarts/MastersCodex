-- Migração para ajustar e garantir políticas RLS corretas na tabela party_loot_sessions
DROP POLICY IF EXISTS "PartyLootSessions_Select" ON public.party_loot_sessions;
DROP POLICY IF EXISTS "PartyLootSessions_Insert" ON public.party_loot_sessions;
DROP POLICY IF EXISTS "PartyLootSessions_Update" ON public.party_loot_sessions;
DROP POLICY IF EXISTS "PartyLootSessions_Delete" ON public.party_loot_sessions;

-- Política de visualização (SELECT)
CREATE POLICY "PartyLootSessions_Select" ON public.party_loot_sessions 
  FOR SELECT USING (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

-- Política de inserção (INSERT): Mestre ou jogador pode iniciar uma sessão de loot
CREATE POLICY "PartyLootSessions_Insert" ON public.party_loot_sessions 
  FOR INSERT WITH CHECK (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

-- Política de atualização (UPDATE): Permite resgatar itens e fechar o baú
CREATE POLICY "PartyLootSessions_Update" ON public.party_loot_sessions 
  FOR UPDATE USING (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

-- Política de deleção (DELETE): Apenas o DM pode deletar sessões de loot
CREATE POLICY "PartyLootSessions_Delete" ON public.party_loot_sessions 
  FOR DELETE USING (
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  );
