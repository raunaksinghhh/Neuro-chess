// AI Personas and Elo Configurations

export const AI_PERSONAS = [
  {
    id: 'novice',
    name: 'Pawn (Beginner)',
    title: 'Level 1 — Beginner',
    elo: 800,
    depth: 1,
    randomness: 0.45,
    blunderChance: 0.35,
    avatar: 'PW',
    description: 'Makes frequent casual mistakes. Ideal for beginners learning piece movement and basic tactics.',
    color: '#10b981'
  },
  {
    id: 'club',
    name: 'Rook (Club Level)',
    title: 'Level 2 — Club Player',
    elo: 1350,
    depth: 2,
    randomness: 0.2,
    blunderChance: 0.15,
    avatar: 'RK',
    description: 'Plays solid openings and basic tactics. Punishes obvious blunders but misses complex combinations.',
    color: '#3b82f6'
  },
  {
    id: 'advanced',
    name: 'Bishop (Advanced)',
    title: 'Level 3 — Advanced',
    elo: 1850,
    depth: 3,
    randomness: 0.05,
    blunderChance: 0.04,
    avatar: 'BP',
    description: 'Prefers sharp tactical positions, dynamic sacrifices, and aggressive king attacks.',
    color: '#f59e0b'
  },
  {
    id: 'expert',
    name: 'Knight (Expert)',
    title: 'Level 4 — Expert',
    elo: 2350,
    depth: 4,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'KN',
    description: 'Plays at grandmaster level — grinding positional advantages, precise endgames, and deep calculation.',
    color: '#a855f7'
  },
  {
    id: 'neural_super',
    name: 'Apex (Neural Engine)',
    title: 'Level 5 — Neural Engine',
    elo: 2850,
    depth: 5,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'AX',
    description: 'Maximum depth alpha-beta minimax engine with neural evaluation and deep quiescence search. Near-perfect play.',
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
