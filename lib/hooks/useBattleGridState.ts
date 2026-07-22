import { useState, useEffect, useRef, useCallback } from 'react';
import { Combatant } from '@/lib/types';

export function useBattleGridState(
  combatants: Combatant[],
  tokenPositions3D: Record<string, { x: number; z: number }>,
  tokenRotations3D: Record<string, number>,
  updateTokenPosition3D: (idOrName: string, deltaX?: number, deltaZ?: number, newX?: number, newZ?: number) => void,
  updateTokenRotation3D: (idOrName: string, angleInDegrees: number) => void,
  isDm: boolean,
  isPlacementPhase: boolean,
  setupMode: 'normal' | 'player_ambush' | 'player_surprised',
  userCharacterName?: string
) {
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; z: number }>>({});
  const [localRotations, setLocalRotations] = useState<Record<string, number>>({});

  const canUserControlCombatant = useCallback(
    (c: Combatant | undefined): boolean => {
      if (!c) return false;
      if (isDm) return true;

      if (isPlacementPhase && setupMode === 'player_surprised') {
        return false;
      }

      if (c.type !== 'player') return false;

      if (userCharacterName && c.name.toLowerCase() === userCharacterName.toLowerCase()) {
        return true;
      }

      return false;
    },
    [isDm, isPlacementPhase, setupMode, userCharacterName]
  );

  // Sync token positions from LiveCockpitContext
  useEffect(() => {
    if (tokenPositions3D && Object.keys(tokenPositions3D).length > 0) {
      setLocalPositions((prev) => ({
        ...prev,
        ...tokenPositions3D,
      }));
    }
  }, [tokenPositions3D]);

  // Sync token rotations from LiveCockpitContext
  useEffect(() => {
    if (tokenRotations3D && Object.keys(tokenRotations3D).length > 0) {
      setLocalRotations((prev) => ({
        ...prev,
        ...tokenRotations3D,
      }));
    }
  }, [tokenRotations3D]);

  const handleRotateSelected = useCallback(
    (angleDeltaDegrees: number) => {
      if (!selectedCombatantId) return;
      const target = combatants.find((c) => c.id === selectedCombatantId || c.name === selectedCombatantId);
      if (!canUserControlCombatant(target)) return;

      const targetKey = target?.id || selectedCombatantId;
      const current = localRotations[targetKey] || 0;
      const nextAngle = (current + angleDeltaDegrees + 360) % 360;

      setLocalRotations((prev) => ({
        ...prev,
        [targetKey]: nextAngle,
      }));

      updateTokenRotation3D(targetKey, nextAngle);
    },
    [selectedCombatantId, combatants, canUserControlCombatant, localRotations, updateTokenRotation3D]
  );

  return {
    selectedCombatantId,
    setSelectedCombatantId,
    localPositions,
    setLocalPositions,
    localRotations,
    setLocalRotations,
    canUserControlCombatant,
    handleRotateSelected,
  };
}
