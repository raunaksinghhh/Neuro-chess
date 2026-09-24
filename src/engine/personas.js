// AI Personas and Elo Configurations

export const AI_PERSONAS = [
  {
    id: 'novice',
    name: 'Spark (Novice)',
    title: 'Beginner AI',
    elo: 800,
    depth: 1,
    randomness: 0.45,
    blunderChance: 0.35,
    avatar: 'SP',
    description: 'Makes occasional casual mistakes. Great for beginners learning piece movement and tactics.',
    color: '#10b981'
  },
  {
    id: 'club',
    name: 'Byte (Club Player)',
    title: 'Intermediate AI',
    elo: 1350,
    depth: 2,
    randomness: 0.2,
    blunderChance: 0.15,
    avatar: 'BY',
    description: 'Solid basic openings and tactics. Punishes obvious blunders.',
    color: '#3b82f6'
  },
  {
    id: 'tal',
    name: 'Tal (Romantic Attacker)',
    title: 'Aggressive Master',
    elo: 1850,
    depth: 3,
    randomness: 0.05,
    blunderChance: 0.04,
    avatar: 'TL',
    description: 'Prefers dynamic sacrifices, king attacks, and sharp tactical positions.',
    color: '#f59e0b'
  },
  {
    id: 'magnus',
    name: 'Vortex (Positional GM)',
    title: 'Grandmaster AI',
    elo: 2350,
    depth: 4,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'VX',
    description: 'Grinds out incremental advantages with positional mastery and endgames.',
    color: '#a855f7'
  },
  {
    id: 'neural_super',
    name: 'NeuroNet Zero (Super-GM)',
    title: 'Neural Engine 2800+',
    elo: 2850,
    depth: 5,
    randomness: 0.0,
    blunderChance: 0.0,
    avatar: 'NZ',
    description: 'Maximum depth Alpha-Beta minimax engine with neural evaluation and deep quiescence search.',
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
