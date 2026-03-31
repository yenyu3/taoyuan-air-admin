import { type CSSProperties, type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number | string;
}

export default function Card({ children, style, padding = 24 }: CardProps) {
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
}
