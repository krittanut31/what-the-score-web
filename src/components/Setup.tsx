import { CAP, teamName, type BestOf, type Config, type Mode, type Points, type Side } from '../logic'
import { ShuttleIcon } from './icons'
import { Segmented } from './Segmented'

interface Props {
  config: Config
  onChange: (config: Config) => void
  onStart: () => void
  onResume: (() => void) | null
}

const TEAM_PLACEHOLDER = ['เช่น ทีมสายฟ้า', 'เช่น ทีมพายุ']

export function Setup({ config, onChange, onStart, onResume }: Props) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) => onChange({ ...config, [key]: value })

  const setTeam = (t: Side, field: 'name' | 0 | 1, value: string) => {
    const teams = config.teams.map((team, i) => {
      if (i !== t) return team
      if (field === 'name') return { ...team, name: value }
      const players = [...team.players] as [string, string]
      players[field] = value
      return { ...team, players }
    }) as Config['teams']
    onChange({ ...config, teams })
  }

  const doubles = config.mode === 'doubles'

  return (
    <main className="screen setup">
      <header className="brand">
        <div className="brand-mark">
          <ShuttleIcon size={30} />
        </div>
        <div>
          <h1>นับแต้มแบด</h1>
          <p>ตั้งค่าแมตช์ก่อนเริ่มเล่น</p>
        </div>
      </header>

      <section>
        <h2 className="label">ประเภทการแข่ง</h2>
        <Segmented<Mode>
          label="ประเภทการแข่ง"
          value={config.mode}
          onChange={(v) => set('mode', v)}
          options={[
            { value: 'singles', label: 'เดี่ยว' },
            { value: 'doubles', label: 'คู่' },
          ]}
        />
      </section>

      {([0, 1] as Side[]).map((t) => (
        <section key={t} className={`card team-card team-${t}`}>
          <h3 className="team-title">
            <span className="dot" />
            ฝ่าย {t === 0 ? 'A' : 'B'}
          </h3>
          {doubles ? (
            <>
              <Field label="ชื่อทีม" value={config.teams[t].name} placeholder={TEAM_PLACEHOLDER[t]}
                onChange={(v) => setTeam(t, 'name', v)} />
              <Field label="ผู้เล่น 1" value={config.teams[t].players[0]} placeholder="ยืนคอร์ตขวาตอนเริ่ม"
                onChange={(v) => setTeam(t, 0, v)} />
              <Field label="ผู้เล่น 2" value={config.teams[t].players[1]} placeholder="ยืนคอร์ตซ้ายตอนเริ่ม"
                onChange={(v) => setTeam(t, 1, v)} />
            </>
          ) : (
            <Field label="ชื่อผู้เล่น" value={config.teams[t].players[0]} placeholder={t === 0 ? 'เช่น นนท์' : 'เช่น พลอย'}
              onChange={(v) => setTeam(t, 0, v)} />
          )}
        </section>
      ))}

      <section>
        <h2 className="label">แต้มต่อเกม</h2>
        <Segmented<Points>
          label="แต้มต่อเกม"
          value={config.points}
          onChange={(v) => set('points', v)}
          options={[21, 15, 11].map((p) => ({ value: p as Points, label: `${p} แต้ม` }))}
        />
        <p className="hint">
          ต้องชนะห่าง 2 แต้ม · ถ้าเสมอกันไปเรื่อย ๆ แต้มที่ {CAP[config.points]} ชนะทันที
        </p>
      </section>

      <section>
        <h2 className="label">จำนวนเกม</h2>
        <Segmented<BestOf>
          label="จำนวนเกม"
          value={config.bestOf}
          onChange={(v) => set('bestOf', v)}
          options={[
            { value: 1, label: '1 เกม' },
            { value: 3, label: '2 ใน 3 เกม' },
          ]}
        />
      </section>

      <section>
        <h2 className="label">เสิร์ฟก่อน</h2>
        <Segmented<Side>
          label="ฝ่ายที่เสิร์ฟก่อน"
          value={config.firstServer}
          onChange={(v) => set('firstServer', v)}
          options={[
            { value: 0, label: teamName(config, 0) },
            { value: 1, label: teamName(config, 1) },
          ]}
        />
      </section>

      <div className="actions">
        <button type="button" className="btn primary" onClick={onStart}>
          เริ่มแมตช์
        </button>
        {onResume && (
          <button type="button" className="btn outline" onClick={onResume}>
            กลับไปแมตช์ที่ค้างอยู่
          </button>
        )}
      </div>
    </main>
  )
}

function Field(props: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        value={props.value}
        placeholder={props.placeholder}
        maxLength={24}
        autoComplete="off"
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  )
}
