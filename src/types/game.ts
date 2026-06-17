export interface User {
  id: string
  displayName: string
  email: string
}

export interface GameStatus {
  status: 'waiting' | 'gathering_categories' | 'categories_ready' | 'round_active' | 'round_end' | 'game_end' | 'game_in_progress'
  gameId: string
  currentRound: number
  totalRounds: number
  players: string[]
  guesser?: string
  word?: string
  role?: 'guesser' | 'cluegiver'
}

export interface Score {
  userId: string
  displayName: string
  points: number
  rank: number
}

export interface Category {
  id: string
  url: string
  name?: string
}

export interface GameResult {
  winners: string[]
  scores: Score[]
  recordsBroken?: string[]
}
