import { playerName, summarize, teamName, type Config, type Match, type Side } from '../logic'
import { TrophyIcon } from './icons'

interface Props {
  config: Config
  match: Match
  onRematch: () => void
  onUndo: () => void
  onSetup: () => void
}

export function ResultScreen({ config, match, onRematch, onUndo, onSetup }: Props) {
  const { games, wins, matchWinner } = summarize(config, match)
  const winner = matchWinner as Side
  const loser: Side = winner === 0 ? 1 : 0
  const totals = [0, 1].map((t) => games.reduce((sum, g) => sum + g.score[t], 0))

  return (
    <main className="screen result">
      <div className="trophy">
        <TrophyIcon />
      </div>
      <p className="label">ผู้ชนะแมตช์</p>
      <h1 className={`team-text-${winner}`}>{teamName(config, winner)}</h1>
      {config.mode === 'doubles' && (
        <p className="muted">
          {playerName(config, winner, 0)} · {playerName(config, winner, 1)}
        </p>
      )}
      <p className="final-score">
        {wins[winner]} – {wins[loser]}
      </p>
      <p className="muted">เกมที่ชนะ</p>

      <table className="card result-table">
        <thead>
          <tr>
            <th>เกม</th>
            <th className="team-text-0">{teamName(config, 0)}</th>
            <th className="team-text-1">{teamName(config, 1)}</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.index}>
              <th scope="row">เกม {g.index + 1}</th>
              {([0, 1] as Side[]).map((t) => (
                <td key={t} className={g.winner === t ? `team-text-${t}` : ''}>
                  {g.score[t]}
                </td>
              ))}
            </tr>
          ))}
          <tr className="total">
            <th scope="row">แต้มรวม</th>
            <td>{totals[0]}</td>
            <td>{totals[1]}</td>
          </tr>
        </tbody>
      </table>

      <div className="actions">
        <button type="button" className="btn dark" onClick={onRematch}>
          แมตช์ใหม่ (ผู้เล่นเดิม)
        </button>
        <div className="actions-row">
          <button type="button" className="btn soft" onClick={onUndo}>
            ย้อนแต้มล่าสุด
          </button>
          <button type="button" className="btn outline" onClick={onSetup}>
            ตั้งค่าใหม่
          </button>
        </div>
      </div>
    </main>
  )
}
