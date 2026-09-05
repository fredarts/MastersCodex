import { 
  extractYouTubeVideoId, 
  isYouTubeUrl, 
  isVideoFileUrl, 
  isAnyVideoMapUrl, 
  getYouTubeEmbedUrl, 
  LIVING_BATTLEMAPS_PRESETS 
} from '../living-battlemaps-catalog';

describe('YouTube & Living Battlemaps Utilities', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=3H0vW4WpQ_o')).toBe('3H0vW4WpQ_o');
    });

    it('should extract ID from short youtu.be URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/3H0vW4WpQ_o')).toBe('3H0vW4WpQ_o');
    });

    it('should extract ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/3H0vW4WpQ_o')).toBe('3H0vW4WpQ_o');
    });

    it('should extract ID from shorts URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/3H0vW4WpQ_o')).toBe('3H0vW4WpQ_o');
    });

    it('should extract ID from URL with extra parameters like timestamp and playlist', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=3H0vW4WpQ_o&t=120s&list=RD12345')).toBe('3H0vW4WpQ_o');
    });

    it('should handle raw 11-char video ID directly', () => {
      expect(extractYouTubeVideoId('3H0vW4WpQ_o')).toBe('3H0vW4WpQ_o');
    });

    it('should return null for non-youtube URLs or invalid input', () => {
      expect(extractYouTubeVideoId('https://example.com/map.jpg')).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId(undefined)).toBeNull();
      expect(extractYouTubeVideoId(null)).toBeNull();
    });
  });

  describe('isYouTubeUrl', () => {
    it('should return true for valid YouTube links', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=3H0vW4WpQ_o')).toBe(true);
      expect(isYouTubeUrl('https://youtu.be/3H0vW4WpQ_o')).toBe(true);
    });

    it('should return false for regular images and direct videos', () => {
      expect(isYouTubeUrl('https://images.unsplash.com/photo-1.jpg')).toBe(false);
      expect(isYouTubeUrl('https://cdn.example.com/video.mp4')).toBe(false);
    });
  });

  describe('isVideoFileUrl', () => {
    it('should return true for direct video file extensions', () => {
      expect(isVideoFileUrl('https://cdn.example.com/battlemap.mp4')).toBe(true);
      expect(isVideoFileUrl('https://cdn.example.com/battlemap.webm')).toBe(true);
      expect(isVideoFileUrl('https://cdn.example.com/battlemap.mp4?token=123')).toBe(true);
    });

    it('should return false for youtube or image URLs', () => {
      expect(isVideoFileUrl('https://youtube.com/watch?v=123')).toBe(false);
      expect(isVideoFileUrl('https://cdn.example.com/map.png')).toBe(false);
    });
  });

  describe('isAnyVideoMapUrl', () => {
    it('should identify both YouTube and video files', () => {
      expect(isAnyVideoMapUrl('https://youtu.be/3H0vW4WpQ_o')).toBe(true);
      expect(isAnyVideoMapUrl('https://cdn.example.com/battlemap.mp4')).toBe(true);
      expect(isAnyVideoMapUrl('https://cdn.example.com/static.png')).toBe(false);
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('should generate optimized looped embed URL', () => {
      const url = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=3H0vW4WpQ_o', {
        autoplay: true,
        mute: true,
        loop: true,
        controls: false,
      });

      expect(url).toContain('https://www.youtube-nocookie.com/embed/3H0vW4WpQ_o?');
      expect(url).toContain('autoplay=1');
      expect(url).toContain('mute=1');
      expect(url).toContain('controls=0');
      expect(url).toContain('loop=1');
      expect(url).toContain('playlist=3H0vW4WpQ_o');
    });
  });

  describe('LIVING_BATTLEMAPS_PRESETS', () => {
    it('should contain predefined presets with valid properties', () => {
      expect(LIVING_BATTLEMAPS_PRESETS.length).toBeGreaterThanOrEqual(5);
      for (const preset of LIVING_BATTLEMAPS_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.youtubeId).toHaveLength(11);
        expect(preset.thumbnailUrl).toContain(preset.youtubeId);
      }
    });
  });
});
