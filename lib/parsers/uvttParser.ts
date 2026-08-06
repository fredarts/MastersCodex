import { WallSegment, LightSource, WallType } from '@/lib/types';

export interface ParsedUVTTMap {
  resolution: {
    mapWidth: number;   // em células de grade
    mapHeight: number;  // em células de grade
    pixelsPerGrid: number;
  };
  imageSrc: string; // Base64 data URL (data:image/png;base64,...)
  walls: WallSegment[];
  lights: LightSource[];
}

/**
 * Parses a Universal VTT (.df2vtt, .uvtt, or JSON) string or file object into structured map data.
 */
export function parseUVTTData(jsonString: string): ParsedUVTTMap {
  const data = JSON.parse(jsonString);

  const pixelsPerGrid = data.resolution?.pixels_per_grid || 70;
  const mapWidth = data.resolution?.map_size?.x || 20;
  const mapHeight = data.resolution?.map_size?.y || 20;

  // Base64 image
  let imageSrc = '';
  if (data.image) {
    if (data.image.startsWith('data:')) {
      imageSrc = data.image;
    } else {
      imageSrc = `data:image/png;base64,${data.image}`;
    }
  }

  // Parse Line of Sight Wall Segments
  const walls: WallSegment[] = [];
  let wallIdCounter = 1;

  if (Array.isArray(data.line_of_sight)) {
    data.line_of_sight.forEach((line: any[]) => {
      if (Array.isArray(line) && line.length >= 2) {
        for (let i = 0; i < line.length - 1; i++) {
          const pt1 = line[i];
          const pt2 = line[i + 1];
          walls.push({
            id: `uvtt-wall-${wallIdCounter++}`,
            x1: pt1.x, // em unidades de grade
            y1: pt1.y,
            x2: pt2.x,
            y2: pt2.y,
            type: 'wall',
            blocksLight: true,
            blocksVision: true,
            blocksMovement: true,
            sense: 'both'
          });
        }
      }
    });
  }

  // Parse Portals / Doors
  if (Array.isArray(data.portals)) {
    data.portals.forEach((portal: any) => {
      if (Array.isArray(portal.bounds) && portal.bounds.length >= 2) {
        const pt1 = portal.bounds[0];
        const pt2 = portal.bounds[1];
        const isClosed = portal.closed !== false;
        walls.push({
          id: `uvtt-door-${wallIdCounter++}`,
          x1: pt1.x,
          y1: pt1.y,
          x2: pt2.x,
          y2: pt2.y,
          type: 'door',
          doorState: isClosed ? 'closed' : 'open',
          blocksLight: isClosed,
          blocksVision: isClosed,
          blocksMovement: isClosed,
          sense: 'both'
        });
      }
    });
  }

  // Parse Lights
  const lights: LightSource[] = [];
  let lightIdCounter = 1;

  if (Array.isArray(data.lights)) {
    data.lights.forEach((light: any) => {
      const x = light.position?.x || 0;
      const y = light.position?.y || 0;
      const range = light.range || 6.0; // em células de grade
      const brightRadius = Math.max(5, Math.round((range * 5) / 2));
      const dimRadius = Math.max(10, Math.round(range * 5));

      // Hex color formatted from UVTT (e.g., "ffffb347" -> #ffb347)
      let colorHex = '#ffaa33';
      if (light.color) {
        const hex = light.color.toString();
        if (hex.length === 8) {
          colorHex = `#${hex.slice(2)}`;
        } else if (hex.startsWith('#')) {
          colorHex = hex;
        } else {
          colorHex = `#${hex}`;
        }
      }

      lights.push({
        id: `uvtt-light-${lightIdCounter++}`,
        x,
        y,
        brightRadius,
        dimRadius,
        color: colorHex,
        intensity: light.intensity || 0.8,
        animation: 'torch'
      });
    });
  }

  return {
    resolution: {
      mapWidth,
      mapHeight,
      pixelsPerGrid
    },
    imageSrc,
    walls,
    lights
  };
}
