'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';
import { campaignService } from '@/lib/services/campaignService';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { CampaignMemberRow } from '@/lib/database.types';
import { mapCampaignMemberRowToDomain } from '@/lib/mappers';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { toast } from 'sonner';

interface CampaignContextType {
  userCampaigns: UserCampaign[];
  setUserCampaigns: React.Dispatch<React.SetStateAction<UserCampaign[]>>;
  activeCampaign: UserCampaign | null;
  setActiveCampaign: (campaign: UserCampaign | null) => void;
  campaignMembers: CampaignMember[];
  setCampaignMembers: React.Dispatch<React.SetStateAction<CampaignMember[]>>;
  fetchCampaignMembers: (campaignId: string) => Promise<void>;
  addCampaignMember: (campaignId: string, characterName: string, role?: 'dm' | 'player') => Promise<void>;
  removeCampaignMember: (memberId: string) => Promise<void>;
  updateCampaignMemberModelUrl: (campaignId: string, characterName: string, modelUrl: string) => Promise<void>;
  createCampaign: (title: string, worldId?: string, description?: string) => Promise<UserCampaign | null>;
  updateCampaign: (updatedCampaign: UserCampaign) => Promise<void>;
  joinCampaignByCode: (code: string, characterName?: string, modelUrl?: string) => Promise<boolean>;
  leaveCampaign: (campaignId: string) => Promise<void>;
  feedEvents: CampaignFeedEvent[];
  setFeedEvents: React.Dispatch<React.SetStateAction<CampaignFeedEvent[]>>;
  createFeedEvent: (eventData: Omit<CampaignFeedEvent, 'id'>) => Promise<CampaignFeedEvent | null>;
  toggleFeedEventVisibility: (id: string) => Promise<void>;
  deleteFeedEvent: (id: string) => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode; currentUserId?: string }> = ({
  children,
  currentUserId,
}) => {
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  const [activeCampaign, setActiveCampaignState] = useState<UserCampaign | null>(null);
  const [campaignMembers, setCampaignMembers] = useState<CampaignMember[]>([]);
  const [feedEvents, setFeedEvents] = useState<CampaignFeedEvent[]>([]);

  useEffect(() => {
    campaignService.fetchUserCampaigns(currentUserId).then((res) => {
      if (res.ok) {
        const camps = res.value;
        if (camps.length > 0) {
          setUserCampaigns(camps);
          const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('codex_activeCampaignId') : null;
          const found = savedActiveId ? camps.find((c) => c.id === savedActiveId) : null;
          const target = found || camps[0];
          setActiveCampaignState(target);

          campaignService.fetchCampaignMembers(target.id, currentUserId).then((mRes) => {
            if (mRes.ok) setCampaignMembers(mRes.value);
            else toast.error(mRes.error.message);
          });
          campaignService.fetchFeedEvents(target.id, currentUserId).then((fRes) => {
            if (fRes.ok) setFeedEvents(fRes.value);
            else toast.error(fRes.error.message);
          });
        }
      } else {
        toast.error(res.error.message);
      }
    });
  }, [currentUserId]);

  const setActiveCampaign = (camp: UserCampaign | null) => {
    setActiveCampaignState(camp);
    try {
      if (camp) {
        localStorage.setItem('codex_activeCampaignId', camp.id);
        campaignService.fetchCampaignMembers(camp.id, currentUserId).then((mRes) => {
          if (mRes.ok) setCampaignMembers(mRes.value);
          else toast.error(mRes.error.message);
        });
        campaignService.fetchFeedEvents(camp.id, currentUserId).then((fRes) => {
          if (fRes.ok) setFeedEvents(fRes.value);
          else toast.error(fRes.error.message);
        });
      } else {
        localStorage.removeItem('codex_activeCampaignId');
      }
    } catch (e) {}
  };

  const fetchCampaignMembers = async (campaignId: string) => {
    const res = await campaignService.fetchCampaignMembers(campaignId, currentUserId);
    if (res.ok) {
      setCampaignMembers(res.value);
    } else {
      toast.error(res.error.message);
    }
  };

  const addCampaignMember = async (campaignId: string, characterName: string, role: 'dm' | 'player' = 'player') => {
    let newMember: CampaignMember = {
      id: `mem-${Date.now()}`,
      campaignId,
      userId: role === 'player' ? `manual-player-${Date.now()}` : (currentUserId || 'demo-dm-user-123'),
      characterName,
      role,
    };

    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      const { data: existing } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('character_name', characterName)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('campaign_members')
          .update({ role, model_url: getModelUrlByNameOrPath(characterName) })
          .eq('id', existing.id)
          .select()
          .single();
        if (updated) {
          newMember = mapCampaignMemberRowToDomain(updated as CampaignMemberRow);
        } else {
          newMember = mapCampaignMemberRowToDomain(existing as CampaignMemberRow);
        }
      } else {
        const { data, error } = await supabase
          .from('campaign_members')
          .insert({
            campaign_id: campaignId,
            user_id: newMember.userId,
            character_name: characterName,
            role: role,
          })
          .select()
          .single();

        if (!error && data) {
          newMember = mapCampaignMemberRowToDomain(data as CampaignMemberRow);
        } else if (error) {
          toast.error(`Erro ao adicionar membro: ${error.message}`);
        }
      }
    }

    setCampaignMembers((prev) => {
      const updated = [...prev.filter((m) => m.id !== newMember.id), newMember];
      try {
        localStorage.setItem('codex_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeCampaignMember = async (memberId: string) => {
    const res = await campaignService.removeCampaignMember(memberId, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setCampaignMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      try {
        localStorage.setItem('codex_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateCampaignMemberModelUrl = async (campaignId: string, characterName: string, modelUrl: string) => {
    if (isSupabaseConfigured() && currentUserId && campaignId && isValidUuid(campaignId)) {
      const { error } = await supabase
        .from('campaign_members')
        .update({ model_url: modelUrl })
        .eq('campaign_id', campaignId)
        .eq('user_id', currentUserId)
        .eq('character_name', characterName);
      if (error) {
        toast.error(`Erro ao atualizar miniatura 3D: ${error.message}`);
      }
    }

    setCampaignMembers((prev) => {
      const updated = prev.map((m) =>
        m.campaignId === campaignId && m.characterName?.toLowerCase() === characterName.toLowerCase()
          ? { ...m, modelUrl }
          : m
      );
      try {
        localStorage.setItem('codex_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const createCampaign = async (title: string, worldId?: string, description = ''): Promise<UserCampaign | null> => {
    const res = await campaignService.createCampaign(title, worldId, description, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newCamp = res.value;
    setUserCampaigns((prev) => {
      const updated = [...prev, newCamp];
      try {
        localStorage.setItem('codex_campaigns', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveCampaign(newCamp);
    return newCamp;
  };

  const updateCampaign = async (updatedCampaign: UserCampaign) => {
    if (isSupabaseConfigured() && isValidUuid(updatedCampaign.id)) {
      const { error } = await supabase
        .from('campaigns')
        .update({
          title: updatedCampaign.title,
          description: updatedCampaign.description,
          world_id: isValidUuid(updatedCampaign.worldId) ? updatedCampaign.worldId : null,
        })
        .eq('id', updatedCampaign.id);

      if (error) {
        toast.error(`Erro ao atualizar campanha: ${error.message}`);
        return;
      }
    }

    setUserCampaigns((prev) => {
      const updated = prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c));
      try {
        localStorage.setItem('codex_campaigns', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (activeCampaign?.id === updatedCampaign.id) {
      setActiveCampaignState(updatedCampaign);
    }
  };

  const joinCampaignByCode = async (code: string, characterName?: string, modelUrl?: string): Promise<boolean> => {
    if (isSupabaseConfigured() && currentUserId) {
      const res = await campaignService.joinCampaignByCode(code, currentUserId, characterName);
      if (!res.ok) {
        toast.error(res.error.message);
        return false;
      }
      if (res.value) {
        const { campaign, member } = res.value;
        
        setUserCampaigns((prev) => {
          if (prev.some((c) => c.id === campaign.id)) return prev;
          const next = [...prev, campaign];
          try {
            localStorage.setItem('codex_campaigns', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        if (member) {
          setCampaignMembers((prev) => {
            const next = [...prev.filter((m) => m.id !== member.id), member];
            try {
              localStorage.setItem('codex_members', JSON.stringify(next));
            } catch (e) {}
            return next;
          });

          if (modelUrl) {
            await updateCampaignMemberModelUrl(campaign.id, characterName || '', modelUrl);
          }
        }

        setActiveCampaign(campaign);
        return true;
      }
    }

    const found = userCampaigns.find((c) => c.inviteCode?.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setActiveCampaign(found);
      if (characterName) {
        await addCampaignMember(found.id, characterName, 'player');
        if (modelUrl) {
          await updateCampaignMemberModelUrl(found.id, characterName, modelUrl);
        }
      }
      return true;
    }
    return false;
  };

  const leaveCampaign = async (campaignId: string) => {
    if (isSupabaseConfigured() && currentUserId && isValidUuid(campaignId)) {
      const { error } = await supabase
        .from('campaign_members')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', currentUserId);
      if (error) {
        toast.error(`Erro ao deixar campanha: ${error.message}`);
        return;
      }
    }

    setUserCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    if (activeCampaign?.id === campaignId) {
      setActiveCampaign(null);
    }
  };

  const createFeedEvent = async (eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent | null> => {
    const payload = {
      ...eventData,
      campaignId: eventData.campaignId || activeCampaign?.id || 'camp-demo-1',
    };
    const res = await campaignService.createFeedEvent(payload, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newEvent = res.value;
    setFeedEvents((prev) => {
      const updated = [newEvent, ...prev];
      try {
        localStorage.setItem('codex_feed', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return newEvent;
  };

  const toggleFeedEventVisibility = async (id: string) => {
    if (isSupabaseConfigured() && isValidUuid(id)) {
      const targetEvent = feedEvents.find((e) => e.id === id);
      if (targetEvent) {
        const { error } = await supabase
          .from('campaign_feed_events')
          .update({ is_public: !targetEvent.isPublic })
          .eq('id', id);
        if (error) {
          toast.error(`Erro ao alterar visibilidade do feed: ${error.message}`);
          return;
        }
      }
    }

    setFeedEvents((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e));
      try {
        localStorage.setItem('codex_feed', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const deleteFeedEvent = async (id: string) => {
    if (isSupabaseConfigured() && isValidUuid(id)) {
      const { error } = await supabase
        .from('campaign_feed_events')
        .delete()
        .eq('id', id);
      if (error) {
        toast.error(`Erro ao remover evento do feed: ${error.message}`);
        return;
      }
    }

    setFeedEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem('codex_feed', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <CampaignContext.Provider
      value={{
        userCampaigns,
        setUserCampaigns,
        activeCampaign,
        setActiveCampaign,
        campaignMembers,
        setCampaignMembers,
        fetchCampaignMembers,
        addCampaignMember,
        removeCampaignMember,
        updateCampaignMemberModelUrl,
        createCampaign,
        updateCampaign,
        joinCampaignByCode,
        leaveCampaign,
        feedEvents,
        setFeedEvents,
        createFeedEvent,
        toggleFeedEventVisibility,
        deleteFeedEvent,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
