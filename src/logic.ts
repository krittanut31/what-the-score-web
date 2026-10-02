// Badminton scoring rules (BWF rally-point system), kept pure so the UI can
// replay the rally history for any state — which also makes undo trivial.

export type Mode = 'singles' | 'doubles'
export type Side = 0 | 1
export type Court = 'right' | 'left'
export type Points = 21 | 15 | 11
export type BestOf = 1 | 3

export interface Team {
  name: string
  players: [string, string]
}

export interface Config {
  mode: Mode
  teams: [Team, Team]
  points: Points
  bestOf: BestOf
  firstServer: Side
}

export interface Match {
  /** One array of rally winners per game; the last array is the game in progress. */
  games: Side[][]
  /** Manual ends swap from the ↑↓ button, on top of the automatic changes. */
  swapped: boolean
}

export interface GameState {
  index: number
  score: [number, number]
  serving: Side
  /** Index of the player standing in the right service court, per team (doubles). */
  right: [0 | 1, 0 | 1]
  winner: Side | null
}

export const CAP: Record<Points, number> = { 21: 30, 15: 21, 11: 15 }

export const other = (s: Side): Side => (s === 0 ? 1 : 0)

export const winsNeeded = (bestOf: BestOf) => (bestOf === 3 ? 2 : 1)

/** Score at which players change ends in the deciding game. */
export const intervalAt = (points: Points) => Math.ceil(points / 2)

export function gameWinner(score: [number, number], points: Points): Side | null {
  for (const s of [0, 1] as Side[]) {
    const a = score[s]
    const b = score[other(s)]
    if (a >= CAP[points] || (a >= points && a - b >= 2)) return s
  }
  return null
}

export function replayGame(config: Config, rallies: Side[], index: number, firstServer: Side): GameState {
  const score: [number, number] = [0, 0]
  const right: [0 | 1, 0 | 1] = [0, 0]
  let serving = firstServer
  for (const w of rallies) {
    score[w]++
    if (w === serving) {
      // Serving side scores: the server switches service courts with the partner.
      if (config.mode === 'doubles') right[w] = right[w] === 0 ? 1 : 0
    } else {
      // Receiving side wins the serve; nobody changes courts.
      serving = w
    }
  }
  return { index, score, serving, right, winner: gameWinner(score, config.points) }
}

export interface Summary {
  games: GameState[]
  current: GameState
  wins: [number, number]
  matchWinner: Side | null
}

export function summarize(config: Config, match: Match): Summary {
  const games: GameState[] = []
  const wins: [number, number] = [0, 0]
  match.games.forEach((rallies, i) => {
    // Winner of the previous game serves first in the next one.
    const first = i === 0 ? config.firstServer : (games[i - 1].winner ?? config.firstServer)
    const g = replayGame(config, rallies, i, first)
    games.push(g)
    if (g.winner !== null) wins[g.winner]++
  })
  const need = winsNeeded(config.bestOf)
  const matchWinner = wins[0] >= need ? 0 : wins[1] >= need ? 1 : null
  return { games, current: games[games.length - 1], wins, matchWinner }
}

export interface ServeInfo {
  server: Side
  receiver: Side
  court: Court
  serverPlayer: 0 | 1
  receiverPlayer: 0 | 1
}

export function serveInfo(config: Config, g: GameState): ServeInfo {
  const server = g.serving
  const receiver = other(server)
  const court: Court = g.score[server] % 2 === 0 ? 'right' : 'left'
  if (config.mode === 'singles') return { server, receiver, court, serverPlayer: 0, receiverPlayer: 0 }
  const inCourt = (t: Side): 0 | 1 => (court === 'right' ? g.right[t] : g.right[t] === 0 ? 1 : 0)
  return { server, receiver, court, serverPlayer: inCourt(server), receiverPlayer: inCourt(receiver) }
}

/** Service court each player of a team is standing in. */
export function playerCourts(config: Config, g: GameState, team: Side): { player: 0 | 1; court: Court }[] {
  if (config.mode === 'singles') {
    return [{ player: 0, court: g.score[g.serving] % 2 === 0 ? 'right' : 'left' }]
  }
  const r = g.right[team]
  return [
    { player: r, court: 'right' },
    { player: r === 0 ? 1 : 0, court: 'left' },
  ]
}

/** Casual mode: set true to restore BWF automatic end changes (every game + interval in the decider). */
export const AUTO_SWAP_ENDS = false

const isDecider = (config: Config, index: number) => index === config.bestOf - 1

/** True when team A should be drawn at the far (top) end of the court. */
export function teamAOnTop(config: Config, match: Match, g: GameState): boolean {
  let flipped = match.swapped !== (AUTO_SWAP_ENDS && g.index % 2 === 1)
  if (AUTO_SWAP_ENDS && isDecider(config, g.index) && Math.max(...g.score) >= intervalAt(config.points)) flipped = !flipped
  return !flipped
}

/** True when the last rally took the leading score to the interval in the deciding game. */
export function justChangedEnds(config: Config, match: Match): boolean {
  if (!AUTO_SWAP_ENDS) return false
  const i = match.games.length - 1
  const rallies = match.games[i]
  if (!isDecider(config, i) || rallies.length === 0) return false
  const at = intervalAt(config.points)
  const before = [0, 0]
  rallies.slice(0, -1).forEach((w) => before[w]++)
  const after = [...before]
  after[rallies[rallies.length - 1]]++
  return Math.max(...before) < at && Math.max(...after) >= at
}

export function hasGamePoint(config: Config, g: GameState, team: Side): boolean {
  if (g.winner !== null) return false
  const next: [number, number] = [...g.score]
  next[team]++
  return gameWinner(next, config.points) === team
}

export function addRally(match: Match, winner: Side): Match {
  const games = match.games.slice()
  games[games.length - 1] = [...games[games.length - 1], winner]
  return { ...match, games }
}

export function undoRally(match: Match): Match {
  const games = match.games.slice()
  // An empty new game means the last rally lives in the previous game.
  if (games[games.length - 1].length === 0 && games.length > 1) games.pop()
  const last = games[games.length - 1]
  if (last.length === 0) return match
  games[games.length - 1] = last.slice(0, -1)
  return { ...match, games }
}

export function startNextGame(match: Match): Match {
  return { ...match, games: [...match.games, []] }
}

export const newMatch = (): Match => ({ games: [[]], swapped: false })

export const canUndo = (match: Match) => match.games.some((g) => g.length > 0)

// ---- Display names -------------------------------------------------------

const LETTER = ['A', 'B'] as const

export function teamName(config: Config, t: Side): string {
  const team = config.teams[t]
  if (config.mode === 'singles') return team.players[0].trim() || `ผู้เล่น ${LETTER[t]}`
  return team.name.trim() || `ฝ่าย ${LETTER[t]}`
}

export function playerName(config: Config, t: Side, p: 0 | 1): string {
  if (config.mode === 'singles') return teamName(config, t)
  return config.teams[t].players[p].trim() || `${LETTER[t]}${p + 1}`
}

/** Letter shown inside a player's circle: first Thai consonant or Latin letter. */
export function initial(name: string): string {
  const fallback = name.match(/^(?:ผู้เล่น |ฝ่าย )?([AB][12]?)$/)
  if (fallback) return fallback[1]
  const m = name.match(/[ก-ฮA-Za-z0-9]/)
  return (m ? m[0] : name.charAt(0)).toUpperCase()
}
