'use client';

import React from 'react';
import { CreateSceneModal } from '@/components/CreateSceneModal';
import { AddCombatantModal } from '@/components/live-cockpit/AddCombatantModal';
import { BattleSetupModal, BattleSetupMode } from '@/components/live-cockpit/BattleSetupModal';
import { Combatant, CampaignMember } from '@/lib/types';

interface LiveCockpitModalManagerProps {
  showCreateSceneModal: boolean;
  setShowCreateSceneModal: (show: boolean) => void;
  showAddCombatantModal: boolean;
  setShowAddCombatantModal: (show: boolean) => void;
  showBattleSetupModal: boolean;
  setShowBattleSetupModal: (show: boolean) => void;
  campaignMembers: CampaignMember[];
  onAddCombatant: (c: Combatant) => void;
  onConfirmBattleSetup: (mode: BattleSetupMode, timeOfDay: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => void;
}

export const LiveCockpitModalManager: React.FC<LiveCockpitModalManagerProps> = ({
  showCreateSceneModal,
  setShowCreateSceneModal,
  showAddCombatantModal,
  setShowAddCombatantModal,
  showBattleSetupModal,
  setShowBattleSetupModal,
  campaignMembers,
  onAddCombatant,
  onConfirmBattleSetup,
}) => {
  return (
    <>
      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />

      <AddCombatantModal
        isOpen={showAddCombatantModal}
        onClose={() => setShowAddCombatantModal(false)}
        campaignMembers={campaignMembers}
        onAddCombatant={onAddCombatant}
      />

      <BattleSetupModal
        isOpen={showBattleSetupModal}
        onClose={() => setShowBattleSetupModal(false)}
        onConfirmSetup={onConfirmBattleSetup}
      />
    </>
  );
};
