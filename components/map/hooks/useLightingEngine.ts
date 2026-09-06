'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Cell } from '../../MapMaker';
import { Combatant, LightSource, WallSegment, VisionType } from '@/lib/types';
import { 
  computeVisibilityPolygon, 
  getTokenVisionRadius, 
  getCombatantVisionType,
  isLightVisibleToPlayer 
} from '../visionCore';

export interface CachedPolygonEntry {
  cacheKey: string;
  points: { x: number; y: number }[];
}

const modulePolygonCache = new Map<string, CachedPolygonEntry>();

export interface TokenVisionData {
  r: number;
  c: number;
  radius: number;
  visionType: VisionType;
  tokenName: string;
  tx: number;
  ty: number;
  visionRadiusPx: number;
  polyPoints: { x: number; y: number }[];
}

export interface LightVisibilityData {
  light: LightSource;
  lx: number;
  ly: number;
  lRadius: number;
  polyPoints: { x: number; y: number }[];
  isVisible: boolean;
}

interface UseLightingEngineProps {
  grid: Cell[][];
  vectorWalls?: WallSegment[];
  lightSources?: LightSource[];
  combatants?: Combatant[];
  cellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  bgImageUrl?: string | null;
  isPlayerView?: boolean;
  renderLighting?: boolean;
  renderVision?: boolean;
}

export function useLightingEngine({
  grid,
  vectorWalls,
  lightSources,
  combatants,
  cellSize,
  gridOffsetX,
  gridOffsetY,
  bgImageUrl,
  isPlayerView,
  renderLighting,
  renderVision,
}: UseLightingEngineProps) {
  // Topology version to invalidate cache when walls or doors change
  const [topologyVersion, setTopologyVersion] = useState<number>(1);
  const prevWallTopologyKeyRef = useRef<string>('');

  // Fast signature of wall/door blocking geometry
  const currentWallTopologyKey = useMemo(() => {
    if (!grid || grid.length === 0) return '';
    let key = '';
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;
        if (cell.type === 'wall') key += `w${r}_${c}|`;
        else if (cell.type === 'door') key += `d${r}_${c}_${cell.doorConfig?.status || 'closed'}|`;
        else if (cell.type === 'illusion_wall') key += `i${r}_${c}_${cell.illusionWallConfig?.revealedToPlayers ? '1' : '0'}|`;
      }
    }
    if (vectorWalls && vectorWalls.length > 0) {
      vectorWalls.forEach(w => {
        key += `vw${w.id}_${w.doorState || ''}_${w.blocksVision !== false ? '1' : '0'}|`;
      });
    }
    return key;
  }, [grid, vectorWalls]);

  // Check if wall geometry changed; if so, bump topology version
  useEffect(() => {
    if (currentWallTopologyKey !== prevWallTopologyKeyRef.current) {
      prevWallTopologyKeyRef.current = currentWallTopologyKey;
      setTopologyVersion(v => v + 1);
    }
  }, [currentWallTopologyKey]);

  // Extract active player tokens
  const playerTokens = useMemo(() => {
    const tokens: { r: number; c: number; radius: number; visionType: VisionType; tokenName: string }[] = [];
    if (!grid || grid.length === 0) return tokens;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (cell?.tokenName) {
          const tokenNameClean = cell.tokenName.trim().toLowerCase();
          const isPlayerToken = cell.tokenColor?.includes('cyan') || 
                                cell.tokenColor?.includes('emerald') || 
                                cell.tokenColor?.includes('green') || 
                                cell.tokenColor?.includes('blue') ||
                                combatants?.some((comb: Combatant) => {
                                  if (comb.type !== 'player') return false;
                                  const cName = comb.name.trim().toLowerCase();
                                  return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
                                });
          if (isPlayerToken) {
            tokens.push({
              r,
              c,
              radius: getTokenVisionRadius(cell.tokenName, combatants || []),
              visionType: getCombatantVisionType(cell.tokenName, combatants || []),
              tokenName: cell.tokenName!
            });
          }
        }
      }
    }
    return tokens;
  }, [grid, combatants]);

  // Compute or retrieve cached vision polygons for tokens
  const tokenVisionPolygons = useMemo((): TokenVisionData[] => {
    if (!renderVision || playerTokens.length === 0 || !grid || grid.length === 0) return [];
    const topVer = topologyVersion;
    const hasBg = Boolean(bgImageUrl);

    return playerTokens.map((pt) => {
      const tx = hasBg ? gridOffsetX + pt.c * cellSize + cellSize / 2 : pt.c * cellSize + cellSize / 2;
      const ty = hasBg ? gridOffsetY + pt.r * cellSize + cellSize / 2 : pt.r * cellSize + cellSize / 2;
      const visionRadiusPx = pt.radius * cellSize;

      const pinId = `token_${pt.tokenName}_${pt.r}_${pt.c}`;
      const cacheKey = `${pinId}_${tx.toFixed(1)}_${ty.toFixed(1)}_${visionRadiusPx.toFixed(1)}_${topVer}_${pt.visionType}`;

      let polyPoints: { x: number; y: number }[];
      const cached = modulePolygonCache.get(pinId);

      if (cached && cached.cacheKey === cacheKey) {
        polyPoints = cached.points;
      } else {
        polyPoints = computeVisibilityPolygon(
          tx, ty, visionRadiusPx, grid, cellSize, gridOffsetX, gridOffsetY, hasBg, vectorWalls, pt.visionType
        );
        modulePolygonCache.set(pinId, { cacheKey, points: polyPoints });
      }

      return {
        r: pt.r,
        c: pt.c,
        radius: pt.radius,
        visionType: pt.visionType,
        tokenName: pt.tokenName,
        tx,
        ty,
        visionRadiusPx,
        polyPoints
      };
    });
  }, [renderVision, playerTokens, grid, vectorWalls, cellSize, gridOffsetX, gridOffsetY, bgImageUrl, topologyVersion]);

  // Compute or retrieve cached light polygons
  const lightPolygons = useMemo((): LightVisibilityData[] => {
    if (!renderLighting || !lightSources || lightSources.length === 0 || !grid || grid.length === 0) return [];
    const topVer = topologyVersion;
    const hasBg = Boolean(bgImageUrl);

    return lightSources.map((light) => {
      const isVisible = !isPlayerView || isLightVisibleToPlayer(
        light, playerTokens, grid, vectorWalls || [], cellSize, gridOffsetX, gridOffsetY, hasBg
      );

      const lx = light.x < 150 ? (hasBg ? gridOffsetX + light.x * cellSize : light.x * cellSize) : light.x;
      const ly = light.y < 150 ? (hasBg ? gridOffsetY + light.y * cellSize : light.y * cellSize) : light.y;
      const lRadius = (light.dimRadius / 5) * cellSize;

      const lightId = `light_${light.id || `${light.x}_${light.y}`}`;
      const cacheKey = `${lightId}_${lx.toFixed(1)}_${ly.toFixed(1)}_${lRadius.toFixed(1)}_${topVer}_${isVisible ? '1' : '0'}`;

      let polyPoints: { x: number; y: number }[] = [];

      if (!isVisible) {
        polyPoints = [];
      } else {
        const cached = modulePolygonCache.get(lightId);
        if (cached && cached.cacheKey === cacheKey) {
          polyPoints = cached.points;
        } else {
          polyPoints = computeVisibilityPolygon(
            lx, ly, lRadius, grid, cellSize, gridOffsetX, gridOffsetY, hasBg, vectorWalls
          );
          modulePolygonCache.set(lightId, { cacheKey, points: polyPoints });
        }
      }

      return { light, lx, ly, lRadius, polyPoints, isVisible };
    });
  }, [renderLighting, lightSources, isPlayerView, playerTokens, grid, vectorWalls, cellSize, gridOffsetX, gridOffsetY, bgImageUrl, topologyVersion]);

  // Helper to compute torch flicker without raycast overhead
  const getLightFlickerParams = useCallback((light: LightSource, now: number) => {
    let alphaMultiplier = 1.0;
    let radiusMultiplier = 1.0;

    if (light.animation === 'torch' || light.animation === 'candle') {
      const lx = light.x < 150 ? light.x * cellSize : light.x;
      const ly = light.y < 150 ? light.y * cellSize : light.y;
      const flicker = (Math.sin(now / 150 + lx * 0.05) + Math.cos(now / 200 + ly * 0.05)) * 0.08;
      radiusMultiplier += flicker;
      alphaMultiplier += flicker;
    } else if (light.animation === 'pulse') {
      const pulse = Math.sin(now / 400) * 0.12;
      radiusMultiplier += pulse;
      alphaMultiplier += pulse * 0.8;
    }

    return { alphaMultiplier, radiusMultiplier };
  }, [cellSize]);

  const invalidateCache = useCallback(() => {
    modulePolygonCache.clear();
    setTopologyVersion(v => v + 1);
  }, []);

  return {
    playerTokens,
    tokenVisionPolygons,
    lightPolygons,
    getLightFlickerParams,
    invalidateCache,
    topologyVersion,
  };
}
