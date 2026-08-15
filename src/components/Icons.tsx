import React from 'react';

export const LogoMark = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor" {...props}>
    <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
  </svg>
);

export const ArrowRight = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRight = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Star = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z" />
  </svg>
);

export const Globe = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 2.75c2.6 2.3 4 5.8 4 9.25s-1.4 6.95-4 9.25c-2.6-2.3-4-5.8-4-9.25s1.4-6.95 4-9.25zM2.75 12h18.5" />
  </svg>
);

export const X = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4l16 16M20 4 4 20" />
  </svg>
);

export const CircleDot = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
  </svg>
);

export const Grid = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
