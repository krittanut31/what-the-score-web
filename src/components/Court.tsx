import { initial, playerCourts, playerName, serveInfo, type Config, type GameState, type Side } from '../logic'

interface Props {
  config: Config
  game: GameState
  topTeam: Side
}

// Real court dimensions in metres, stretched to fit the drawing.
const W = 6.1
const L = 13.4
const VW = 560
const VH = 780
const PAD = 22
const x = (m: number) => PAD + (m / W) * (VW - PAD * 2)
const y = (m: number) => PAD + (m / L) * (VH - PAD * 2)

const NET = L / 2
const SHORT = 1.98
const LONG_DOUBLES = 0.76
const SINGLES_SIDE = 0.46
const R = 44

const COLOR = ['var(--team-a)', 'var(--team-b)']
const LEFT_X = x(1.75)
const RIGHT_X = x(W - 1.75)

/** Position of a service court, as seen by a spectator at the near (bottom) end. */
function spot(top: boolean, court: 'right' | 'left') {
  // Players at the far end face us, so their right is our left.
  const onLeft = top ? court === 'right' : court === 'left'
  return { cx: onLeft ? LEFT_X : RIGHT_X, cy: top ? y(2.7) : y(L - 2.7) }
}

export function Court({ config, game, topTeam }: Props) {
  const serve = serveInfo(config, game)
  const done = game.winner !== null

  const players = ([0, 1] as Side[]).flatMap((team) =>
    playerCourts(config, game, team).map(({ player, court }) => {
      const role =
        done ? 'idle'
        : team === serve.server && player === serve.serverPlayer ? 'server'
        : team === serve.receiver && player === serve.receiverPlayer ? 'receiver'
        : 'idle'
      return { key: `${team}-${player}`, team, name: playerName(config, team, player), role, ...spot(team === topTeam, court) }
    }),
  )

  const from = players.find((p) => p.role === 'server')
  const to = players.find((p) => p.role === 'receiver')
  let line = null
  if (from && to) {
    const dx = to.cx - from.cx
    const dy = to.cy - from.cy
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    line = { x1: from.cx + ux * (R + 8), y1: from.cy + uy * (R + 8), x2: to.cx - ux * (R + 10), y2: to.cy - uy * (R + 10) }
  }

  const label = (text: string, cx: number, cy: number) => (
    <text x={cx} y={cy} className="court-label" textAnchor="middle" dominantBaseline="middle">
      {text}
    </text>
  )
  const topLabelY = y(LONG_DOUBLES / 2)
  const bottomLabelY = y(L - LONG_DOUBLES / 2)

  return (
    <svg className="court" viewBox={`0 0 ${VW} ${VH}`} role="img"
      aria-label={`${playerName(config, serve.server, serve.serverPlayer)} เสิร์ฟ`}>
      <rect x="0" y="0" width={VW} height={VH} rx="18" className="court-surround" />
      <g className="court-lines">
        <rect x={x(0)} y={y(0)} width={x(W) - x(0)} height={y(L) - y(0)} />
        <line x1={x(SINGLES_SIDE)} y1={y(0)} x2={x(SINGLES_SIDE)} y2={y(L)} />
        <line x1={x(W - SINGLES_SIDE)} y1={y(0)} x2={x(W - SINGLES_SIDE)} y2={y(L)} />
        <line x1={x(0)} y1={y(LONG_DOUBLES)} x2={x(W)} y2={y(LONG_DOUBLES)} />
        <line x1={x(0)} y1={y(L - LONG_DOUBLES)} x2={x(W)} y2={y(L - LONG_DOUBLES)} />
        <line x1={x(0)} y1={y(NET - SHORT)} x2={x(W)} y2={y(NET - SHORT)} />
        <line x1={x(0)} y1={y(NET + SHORT)} x2={x(W)} y2={y(NET + SHORT)} />
        <line x1={x(W / 2)} y1={y(0)} x2={x(W / 2)} y2={y(NET - SHORT)} />
        <line x1={x(W / 2)} y1={y(NET + SHORT)} x2={x(W / 2)} y2={y(L)} />
      </g>
      <line x1={4} y1={y(NET)} x2={VW - 4} y2={y(NET)} className="court-net" />

      {label('คอร์ตขวา', LEFT_X, topLabelY)}
      {label('คอร์ตซ้าย', RIGHT_X, topLabelY)}
      {label('คอร์ตซ้าย', LEFT_X, bottomLabelY)}
      {label('คอร์ตขวา', RIGHT_X, bottomLabelY)}

      {line && (
        <g className="serve-line">
          <line {...line} />
          <circle cx={line.x2} cy={line.y2} r="8" />
        </g>
      )}

      {players.map((p) => {
        const pillW = Math.max(64, [...p.name].filter((c) => !/[ัิ-ฺ็-๎]/.test(c)).length * 13 + 30)
        return (
          <g key={p.key} className={`player ${p.role}`} style={{ transform: `translate(${p.cx}px, ${p.cy}px)` }}>
            <circle r={R} fill={COLOR[p.team]} className="player-disc" />
            <text className="player-initial" textAnchor="middle" dominantBaseline="central">
              {initial(p.name)}
            </text>
            <rect x={-pillW / 2} y={R + 10} width={pillW} height="38" rx="12" className="player-pill" />
            <text y={R + 30} className="player-name" textAnchor="middle" dominantBaseline="central">
              {p.name}
            </text>
            {p.role === 'server' && (
              <g transform={`translate(${R * 0.72}, ${-R * 0.72})`}>
                <circle r="19" className="server-badge" />
                <g transform="translate(-11,-11) scale(0.92)" className="server-badge-icon">
                  <path d="M7 3h10l-2.4 10.5H9.4z M10.7 3l.4 10.5M13.3 3l-.4 10.5" />
                  <circle cx="12" cy="17.5" r="3" />
                </g>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
