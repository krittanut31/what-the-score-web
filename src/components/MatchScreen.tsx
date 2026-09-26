import { useEffect } from 'react'
import {
  CAP, canUndo, hasGamePoint, intervalAt, justChangedEnds, playerName, serveInfo, summarize, teamAOnTop,
  teamName, winsNeeded, type Config, type Match, type Side,
} from '../logic'
import { Court } from './Court'
import { BackIcon, ShuttleIcon, SwapIcon, UndoIcon } from './icons'

interface Props {
  config: Config
  match: Match
  onPoint: (team: Side) => void
  onUndo: () => void
  onNextGame: () => void
  onSwap: () => void
  onBack: () => void
}

const COURT_TH = { right: 'คอร์ตขวา', left: 'คอร์ตซ้าย' }

export function MatchScreen({ config, match, onPoint, onUndo, onNextGame, onSwap, onBack }: Props) {
  const summary = summarize(config, match)
  const game = summary.current
  const serve = serveInfo(config, game)
  const topTeam: Side = teamAOnTop(config, match, game) ? 0 : 1
  const finished = summary.games.slice(0, -1)
  const gameOver = game.winner !== null

  useWakeLock()

  const serverName = playerName(config, serve.server, serve.serverPlayer)
  const receiverName = playerName(config, serve.receiver, serve.receiverPlayer)
  const serverScore = game.score[serve.server]

  const need = winsNeeded(config.bestOf)
  const pointTeam = ([0, 1] as Side[]).find((t) => hasGamePoint(config, game, t))
  let status: string | null = null
  if (pointTeam !== undefined) {
    status = summary.wins[pointTeam] + 1 >= need ? 'แมตช์พอยต์' : 'เกมพอยต์'
  }

  let note = `แต้มฝ่ายเสิร์ฟ ${serverScore} เป็นเลข${serverScore % 2 === 0 ? 'คู่' : 'คี่'} → เสิร์ฟจาก${COURT_TH[serve.court]}`
  if (justChangedEnds(config, match)) {
    note = `ถึง ${intervalAt(config.points)} แต้ม · พักครึ่งและเปลี่ยนแดน`
  } else if (game.score[0] === CAP[config.points] - 1 && game.score[1] === game.score[0]) {
    note = `เสมอ ${game.score[0]} · แต้มถัดไปชนะเกม`
  } else if (game.score[0] === game.score[1] && game.score[0] >= config.points - 1) {
    note = `ดิวส์ ${game.score[0]} · ต้องชนะห่าง 2 แต้ม`
  }

  const tap = (t: Side) => {
    navigator.vibrate?.(12)
    onPoint(t)
  }

  return (
    <main className="screen match">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="กลับไปหน้าตั้งค่า">
          <BackIcon />
        </button>
        <div className="topbar-title">
          <h1>เกมที่ {game.index + 1} / {config.bestOf}</h1>
          <p>ประเภท{config.mode === 'doubles' ? 'คู่' : 'เดี่ยว'} · {config.points} แต้ม</p>
        </div>
        <button type="button" className="icon-btn" onClick={onSwap} aria-label="สลับฝั่งคอร์ต">
          <SwapIcon />
        </button>
        <button type="button" className="icon-btn" onClick={onUndo} disabled={!canUndo(match)} aria-label="ย้อนแต้มล่าสุด">
          <UndoIcon />
        </button>
      </header>

      <section className="card scoreboard">
        {([0, 1] as Side[]).map((t) => (
          <div key={t} className={`score-row team-${t}`}>
            <span className="bar" />
            <div className="score-team">
              <div className="score-name">
                <strong>{teamName(config, t)}</strong>
                {!gameOver && serve.server === t && (
                  <span className="serve-chip" aria-label="ฝ่ายเสิร์ฟ">
                    <ShuttleIcon size={16} />
                  </span>
                )}
                {pointTeam === t && <span className="status-chip">{status}</span>}
              </div>
              {config.mode === 'doubles' && (
                <span className="score-players">
                  {playerName(config, t, 0)} · {playerName(config, t, 1)}
                </span>
              )}
            </div>
            {finished.map((g) => (
              <span key={g.index} className={`prev-score ${g.winner === t ? 'won' : ''}`}>
                {g.score[t]}
              </span>
            ))}
            <span className="live-score">{game.score[t]}</span>
          </div>
        ))}
      </section>

      <Court config={config} game={game} topTeam={topTeam} />

      <section className="card serve-info" aria-live="polite">
        <span className="serve-icon">
          <ShuttleIcon size={22} />
        </span>
        <div>
          <strong>
            {serverName} เสิร์ฟจาก{COURT_TH[serve.court]} → {receiverName} รับ
          </strong>
          <p>{note}</p>
        </div>
      </section>

      <div className="point-buttons">
        {([0, 1] as Side[]).map((t) => (
          <button key={t} type="button" className={`point-btn team-${t}`} onClick={() => tap(t)} disabled={gameOver}>
            <span>+1</span>
            <small>{teamName(config, t)}</small>
          </button>
        ))}
      </div>

      {gameOver && summary.matchWinner === null && (
        <div className="sheet-backdrop">
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <p className="label" id="game-over-title">จบเกมที่ {game.index + 1}</p>
            <h2 className={`team-text-${game.winner}`}>{teamName(config, game.winner!)} ชนะ</h2>
            <p className="sheet-score">
              {game.score[0]} – {game.score[1]}
            </p>
            <p className="hint">
              เกมที่ชนะ {summary.wins[0]} – {summary.wins[1]} · {teamName(config, game.winner!)} เสิร์ฟก่อนในเกมถัดไป และเปลี่ยนแดน
            </p>
            <button type="button" className="btn primary" onClick={onNextGame}>
              เริ่มเกมที่ {game.index + 2}
            </button>
            <button type="button" className="btn outline" onClick={onUndo}>
              ย้อนแต้มล่าสุด
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

/** Keep the phone screen on while scoring, where supported. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => {})
    }
  }, [])
}
