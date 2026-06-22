import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Forecast, Publication, Project } from '@/types/database';
import type { CSSProperties } from 'react';

// 1. Définition des styles en dehors du JSX pour satisfaire le typage strict
const axisTickStyle: CSSProperties = { fontSize: 11 };
const tooltipStyle: CSSProperties = { fontSize: 12, borderRadius: 8 };
const legendStyle: CSSProperties = { fontSize: 11 };

// ... (votre code précédent pour PublicationsByYear et ForecastChart reste identique)

/**
 * Pour le ResponsiveContainer, au lieu de caster "100%" en any, 
 * utilisez simplement le type number ou string requis. 
 * Si TypeScript bloque, forcez le type via une variable typée.
 */
const containerWidth: string | number = "100%";
const containerHeight: number = 200;

export function PublicationsByYear({ researcherId }: { researcherId?: string }) {
  // ... (votre logique useQuery)

  return (
    <ResponsiveContainer width={containerWidth} height={containerHeight}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="year" tick={axisTickStyle} />
        <YAxis tick={axisTickStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="published" name="Publiées" fill="#00843D" radius={[4, 4, 0, 0]} />
        <Bar dataKey="accepted" name="Acceptées" fill="#4CAF7A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
