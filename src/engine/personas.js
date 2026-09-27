// AI Personas and Elo Configurations

export const AI_PERSONAS = [
  {
    id: 'beginner',
    name: 'Beginner',
    title: 'Beginner',
    elo: 800,
    depth: 1,
    randomness: 0.45,
    blunderChance: 0.35,
    avatar: 'Beg',
    description: 'Makes frequent casual mistakes. Ideal for players learning piece movement and basic tactics.',
    color: '#10b981'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    title: 'Intermediate',
    elo: 1350,
    depth: 2,
    randomness: 0.2,
    blunderChance: 0.15,
    avatar: 'Int',
    description: 'Plays solid openings and basic tactics. Punishes obvious blunders but misses complex combinations.',
    color: '#3b82f6'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    title: 'Advanced',
    elo: 1850,
    depth: 3,
    randomness: 0.05,
    blunderChance: 0.04,
    avatar: 'Adv',
    description: 'Prefers sharp tactical positions, dynamic sacrifices, and aggressive king attacks.',
    color: '#f59e0b'
  },
  {
    id: 'expert',
    name: 'Expert',
    title: 'Expert',
    elo: 2350,
    depth: 4,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'Exp',
    description: 'Plays at master level — grinding positional advantages, precise endgames, and deep calculation.',
    color: '#a855f7'
  },
  {
    id: 'master',
    name: 'Master',
    title: 'Master',
    elo: 2850,
    depth: 5,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'Mst',
    description: 'Maximum depth alpha-beta minimax engine with neural evaluation and deep quiescence search.',
    color: '#00f0ff'
  }
];

export function getPersonaByElo(elo) {
  let closest = AI_PERSONAS[0];
  let minDiff = 99999;
  for (const p of AI_PERSONAS) {
    const diff = Math.abs(p.elo - elo);
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  return closest;
}
