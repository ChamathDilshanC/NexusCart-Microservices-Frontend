import React from 'react';

// Brand-only mark — no lucide-react equivalent. Every other icon in the app
// uses lucide-react directly.
export const LogoMark = ({ className = '', ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor" {...props}>
    <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
  </svg>
);
