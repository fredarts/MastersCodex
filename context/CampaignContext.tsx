'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';

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
  createCampaign: (title: string, worldId?: string, description?: string) => Promise<UserCampaign>;
  updateCampaign: (updatedCampaign: UserCampaign) => Promise<void>;
  joinCampaignByCode: (code: string, characterName?: string, modelUrl?: string) => Promise<boolean>;
  leaveCampaign: (campaignId: string) => Promise<void>;
  feedEvents: CampaignFeedEvent[];
  setFeedEvents: React.Dispatch<React.SetStateAction<CampaignFeedEvent[]>>;
  createFeedEvent: (eventData: Omit<CampaignFeedEvent, 'id'>) => Promise<CampaignFeedEvent>;
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
    try {
      const savedCampaigns = localStorage.getItem('codex_campaigns');
      const savedMembers = localStorage.getItem('codex_members');
      const savedFeed = localStorage.getItem('codex_feed');
      const savedActiveCampId = localStorage.getItem('codex_activeCampaignId');

      if (savedCampaigns) {
        const parsed: UserCampaign[] = JSON.parse(savedCampaigns);
        setUserCampaigns(parsed);
        if (savedActiveCampId) {
          const found = parsed.find((c) => c.id === savedActiveCampId);
          if (found) setActiveCampaignState(found);
        } else if (parsed.length > 0) {
          setActiveCampaignState(parsed[0]);
        }
      }

      if (savedMembers) setCampaignMembers(JSON.parse(savedMembers));
      if (savedFeed) setFeedEvents(JSON.parse(savedFeed));
    } catch (e) {
      console.error('Error loading CampaignContext:', e);
    }
  }, []);

  const setActiveCampaign = (camp: UserCampaign | null) => {
    setActiveCampaignState(camp);
    try {
      if (camp) {
        localStorage.setItem('codex_activeCampaignId', camp.id);
      } else {
        localStorage.removeItem('codex_activeCampaignId');
      }
    } catch (e) {}
  };

  const fetchCampaignMembers = async (campaignId: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId);
      if (!error && data) {
        const mapped: CampaignMember[] = data.map((m: any) => ({
          id: m.id,
          campaignId: m.campaign_id,
          userId: m.user_id,
          characterName: m.character_name,
          role: m.role,
          joinedAt: m.joined_at,
          modelUrl: m.model_url,
        }));
        setCampaignMembers(mapped);
      }
    }
  };

  const addCampaignMember = async (campaignId: string, characterName: string, role: 'dm' | 'player' = 'player') => {
    const newMember: CampaignMember = {
      id: `mem-${Date.now()}`,
      campaignId,
      userId: currentUserId || 'demo-dm-user-123',
      characterName,
      role,
    };
    setCampaignMembers((prev) => {
      const updated = [...prev, newMember];
      try {
        localStorage.setItem('codex_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeCampaignMember = async (memberId: string) => {
    setCampaignMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      try {
        localStorage.setItem('codex_members', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateCampaignMemberModelUrl = async (campaignId: string, characterName: string, modelUrl: string) => {
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

  const createCampaign = async (title: string, worldId?: string, description = ''): Promise<UserCampaign> => {
    const code = `${title.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCamp: UserCampaign = {
      id: `camp-${Date.now()}`,
      dmId: currentUserId || 'demo-dm-user-123',
      worldId,
      title,
      description,
      inviteCode: code,
      role: 'dm',
    };

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
    setUserCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    if (activeCampaign?.id === campaignId) {
      setActiveCampaign(null);
    }
  };

  const createFeedEvent = async (eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> => {
    const newEvent: CampaignFeedEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
      campaignId: eventData.campaignId || activeCampaign?.id || 'camp-demo-1',
    };
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
    setFeedEvents((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e));
      try {
        localStorage.setItem('codex_feed', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const deleteFeedEvent = async (id: string) => {
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
