import { describe, expect, it } from 'vitest'
import {
  AUTO_SWAP_ENDS, addRally, canUndo, gameWinner, justChangedEnds, newMatch, serveInfo, startNextGame, summarize,
  teamAOnTop, undoRally, initial, type Config, type Match, type Side,
} from './logic'

const doubles: Config = {
  mode: 'doubles',
  teams: [{ name: 'สายฟ้า', players: ['นนท์', 'บีม'] }, { name: 'พายุ', players: ['พลอย', 'ต้น'] }],
  points: 21,
  bestOf: 3,
  firstServer: 0,
}
const singles: Config = { ...doubles, mode: 'singles', bestOf: 1 }

const play = (m: Match, rallies: Side[]) => rallies.reduce(addRally, m)
const current = (c: Config, m: Match) => summarize(c, m).current

describe('gameWinner', () => {
  it('needs a two-point lead', () => {
    expect(gameWinner([21, 19], 21)).toBe(0)
    expect(gameWinner([21, 20], 21)).toBeNull()
    expect(gameWinner([22, 20], 21)).toBe(0)
  })
  it('caps the game', () => {
    expect(gameWinner([29, 30], 21)).toBe(1)
    expect(gameWinner([14, 15], 11)).toBe(1)
    expect(gameWinner([20, 21], 15)).toBe(1)
  })
})

describe('doubles serving', () => {
  it('starts with player 1 serving from the right to the opposing player 1', () => {
    const s = serveInfo(doubles, current(doubles, newMatch()))
    expect(s).toMatchObject({ server: 0, court: 'right', serverPlayer: 0, receiverPlayer: 0 })
  })
  it('same server switches courts after winning a rally', () => {
    const g = current(doubles, play(newMatch(), [0]))
    expect(serveInfo(doubles, g)).toMatchObject({ server: 0, court: 'left', serverPlayer: 0, receiverPlayer: 1 })
  })
  it('serve passes to the player in the matching court, without moving', () => {
    // 1-1: B's score is odd, so B's left-court player (B2) serves.
    const g = current(doubles, play(newMatch(), [0, 1]))
    expect(serveInfo(doubles, g)).toMatchObject({ server: 1, court: 'left', serverPlayer: 1, receiverPlayer: 0 })
    // A wins it back at 2-1: even, A's right-court player (now A2) serves.
    const g2 = current(doubles, play(newMatch(), [0, 1, 0]))
    expect(serveInfo(doubles, g2)).toMatchObject({ server: 0, court: 'right', serverPlayer: 1 })
  })
})

describe('singles serving', () => {
  it('serves from the court matching the server score', () => {
    const g = current(singles, play(newMatch(), [0, 0, 0, 1]))
    expect(serveInfo(singles, g)).toMatchObject({ server: 1, court: 'left' })
  })
})

describe('match flow', () => {
  const win = (t: Side) => Array<Side>(21).fill(t)
  it.skipIf(!AUTO_SWAP_ENDS)('winner of a game serves first in the next and ends change', () => {
    let m = play(newMatch(), win(1))
    expect(summarize(doubles, m).current.winner).toBe(1)
    m = startNextGame(m)
    const g = current(doubles, m)
    expect(g.serving).toBe(1)
    expect(teamAOnTop(doubles, m, g)).toBe(false)
  })
  it('decides a best-of-three match', () => {
    let m = play(newMatch(), win(0))
    m = play(startNextGame(m), win(1))
    m = play(startNextGame(m), win(0))
    const s = summarize(doubles, m)
    expect(s.wins).toEqual([2, 1])
    expect(s.matchWinner).toBe(0)
  })
  it.skipIf(!AUTO_SWAP_ENDS)('changes ends at 11 in the deciding game', () => {
    let m = play(newMatch(), win(0))
    m = play(startNextGame(m), win(1))
    m = play(startNextGame(m), Array<Side>(10).fill(0))
    expect(teamAOnTop(doubles, m, current(doubles, m))).toBe(true)
    m = addRally(m, 0)
    expect(justChangedEnds(doubles, m)).toBe(true)
    expect(teamAOnTop(doubles, m, current(doubles, m))).toBe(false)
    m = addRally(m, 1)
    expect(justChangedEnds(doubles, m)).toBe(false)
  })
  it('undo steps back across a game boundary', () => {
    let m = startNextGame(play(newMatch(), win(0)))
    m = undoRally(m)
    expect(m.games).toHaveLength(1)
    expect(summarize(doubles, m).current.score).toEqual([20, 0])
    expect(canUndo(newMatch())).toBe(false)
    expect(undoRally(newMatch())).toEqual(newMatch())
  })
})

describe('initial', () => {
  it('picks the first consonant', () => {
    expect(initial('นนท์')).toBe('น')
    expect(initial('เบียร์')).toBe('บ')
    expect(initial('A2')).toBe('A2')
    expect(initial('ผู้เล่น B')).toBe('B')
  })
})
