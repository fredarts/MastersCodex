import React from 'react';
import { ReadableItemType } from '@/lib/types';

interface SvgProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const LetterSvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Envelope base */}
    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    {/* Flap fold */}
    <path d="M2 5L12 13L22 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Bottom folds */}
    <path d="M2 19L9.5 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M22 19L14.5 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    {/* Wax Seal */}
    <circle cx="12" cy="13" r="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
    <circle cx="12" cy="13" r="1.2" fill="#fca5a5" />
  </svg>
);

export const NoteSvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Torn note paper */}
    <path
      d="M4 3H18C19.1 3 20 3.9 20 5V19C20 19.5 19.6 20 19 20L17 19L15 20L13 19L11 20L9 19L7 20L5 19L4 20C3.4 20 3 19.6 3 19V4C3 3.4 3.4 3 4 3Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    {/* Handwritten note lines */}
    <line x1="7" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <line x1="7" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <line x1="7" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const DiarySvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Leather cover */}
    <rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    {/* Spine line */}
    <line x1="7" y1="2" x2="7" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
    {/* Ribbon bookmark */}
    <path d="M11 2V10L13 8.5L15 10V2" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
    {/* Metal clasp */}
    <rect x="18" y="10" width="3" height="4" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
  </svg>
);

export const BookSvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Open book pages */}
    <path
      d="M2 6C3.5 5 6.5 4.5 12 6.5C17.5 4.5 20.5 5 22 6V19C20.5 18 17.5 17.5 12 19.5C6.5 17.5 3.5 18 2 19V6Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <line x1="12" y1="6.5" x2="12" y2="19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Text lines */}
    <line x1="5" y1="9" x2="9.5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="5" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="5" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="14.5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="14.5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <line x1="14.5" y1="15" x2="17.5" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const TomeSvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Grimoire cover with reinforced corners */}
    <rect x="3" y="2" width="18" height="20" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="6.5" y1="2" x2="6.5" y2="22" stroke="currentColor" strokeWidth="1.5" />
    {/* Arcane Sigil / Eye in center */}
    <circle cx="14" cy="12" r="4" stroke="#a855f7" strokeWidth="1.2" fill="#581c87" fillOpacity="0.4" />
    <path d="M11 12C12.5 10 15.5 10 17 12C15.5 14 12.5 14 11 12Z" stroke="#c084fc" strokeWidth="1" fill="#7e22ce" />
    <circle cx="14" cy="12" r="1.2" fill="#f3e8ff" />
    {/* Corner trims */}
    <path d="M3 6L7 2M21 6L17 2M3 18L7 22M21 18L17 22" stroke="currentColor" strokeWidth="1" opacity="0.6" />
  </svg>
);

export const ScrollSvg: React.FC<SvgProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Rolled parchment top & bottom */}
    <path
      d="M19 17V5C19 3.9 18.1 3 17 3H6C4.9 3 4 3.9 4 5C4 6.1 4.9 7 6 7H17V19H7C5.9 19 5 19.9 5 21H17C18.1 21 19 20.1 19 19C19 17.9 19.9 17 21 17H19Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="5" cy="5" r="1" fill="currentColor" />
    {/* Inscription runes */}
    <line x1="8" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    <line x1="8" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
  </svg>
);

/**
 * Retorna o ícone SVG correspondente ao tipo de documento legível
 */
export const DocumentTypeIcon: React.FC<{
  type?: ReadableItemType | string;
  size?: number;
  className?: string;
}> = ({ type = 'letter', size = 24, className = '' }) => {
  switch (type) {
    case 'letter':
      return <LetterSvg size={size} className={className} />;
    case 'note':
      return <NoteSvg size={size} className={className} />;
    case 'diary':
      return <DiarySvg size={size} className={className} />;
    case 'book':
      return <BookSvg size={size} className={className} />;
    case 'tome':
      return <TomeSvg size={size} className={className} />;
    case 'scroll':
      return <ScrollSvg size={size} className={className} />;
    default:
      return <LetterSvg size={size} className={className} />;
  }
};
