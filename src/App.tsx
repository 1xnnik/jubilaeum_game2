import { useEffect, useState } from 'react';

const KEY = 'jubilaeum-brings-mit-v1';
const defaults = ['Eine Rolle Klopapier', 'Eine Zigarettenschachtel', 'Einen Schlüsselbund', 'Eine Sonnenbrille', 'Eine Münze', 'Einen Kugelschreiber', 'Ein Taschentuch', 'Eine Armbanduhr', 'Einen Flaschenöffner', 'Einen Kamm oder eine Bürste', 'Einen Kassenbon', 'Eine Socke', 'Einen Lippenpflegestift', 'Eine Packung Kaugummi', 'Einen Gegenstand mit Herz'];
const defaultImages = defaults.map((_, i) => `/items/${i + 1}.svg`);
const colors = ['#cba34c', '#7ba9c9', '#a68ac9', '#74aa8c'];
type Game = { names: string[]; items: string[]; images: string[]; results: (number | null)[]; active: boolean };
const fresh = (): Game => ({ names: ['Team 1', 'Team 2', 'Team 3', 'Team 4'], items: [...defaults], images: [...defaultImages], results: [], active: false });
function load(): Game {
  try {
    const g = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (g && Array.isArray(g.names) && g.names.length === 4 && g.names.every((n: unknown) => typeof n === 'string' && n.length <= 40) && Array.isArray(g.items) && g.items.length === 15 && g.items.every((n: unknown) => typeof n === 'string' && n.trim() && n.length <= 120) && Array.isArray(g.results) && g.results.length <= 15 && g.results.every((n: unknown) => n === null || (Number.isInteger(n) && Number(n) >= 0 && Number(n) < 4)) && typeof g.active === 'boolean' && !(g.active && g.results.length === 15)) return { ...g, images: Array.isArray(g.images) && g.images.length === 15 && g.images.every((v: unknown) => typeof v === "string" && (v.startsWith("/items/") || /^data:image\/(png|jpeg|webp);base64,/.test(v))) ? g.images : [...defaultImages] };
  } catch { /* Start fresh if stored data is unavailable or invalid. */ }
  return fresh();
}
export default function App() {
  const [game, setGame] = useState<Game>(load);
  const [screen, setScreen] = useState<'play' | 'settings' | 'history'>('play');
  const [storageError, setStorageError] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(game)); setStorageError(false); } catch { setStorageError(true); } }, [game]);
  const scores = game.names.map((_, i) => game.results.filter(r => r === i).length);
  const complete = game.results.length === 15;
  const leaders = game.names.filter((_, i) => scores[i] === Math.max(...scores));
  const name = (i: number) => game.names[i].trim() || `Team ${i + 1}`;
  const locked = game.active || game.results.length > 0;
  async function uploadImage(file: File, index: number) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice('Bitte ein PNG-, JPG- oder WebP-Bild auswählen.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setNotice('Bitte ein Bild mit höchstens 5 MB auswählen.'); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw Error();
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const image = canvas.toDataURL('image/webp', 0.8);
      setGame(g => g.active || g.results.length ? g : { ...g, images: g.images.map((v, i) => i === index ? image : v) });
    } catch { setNotice('Das Bild konnte nicht gelesen werden. Bitte eine andere Bilddatei auswählen.'); }
  }
  function award(team: number | null) {
    setGame(g => !g.active || g.results.length >= 15 ? g : { ...g, active: false, results: [...g.results, team] });
  }
  function undo() {
    setGame(g => g.results.length ? { ...g, results: g.results.slice(0, -1), active: true } : g);
  }
  function reset() {
    if (window.confirm('Neues Spiel starten? Alle Punkte und Rundenergebnisse werden zurückgesetzt. Namen und Gegenstände bleiben erhalten.')) {
      setGame(g => ({ ...g, results: [], active: false })); setScreen('play');
    }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setNotice('Vollbild ist in diesem Browser nicht verfügbar.'); }
  }
  return <div className="app">
    <header>
      <div className="edition">JUBILÄUM <span>✦</span> SPIELEABEND</div>
      <div className="header-tools"><button onClick={fullscreen}>⛶ Vollbild</button><button onClick={reset}>Neues Spiel</button></div>
      <img className="logo" src="/logo.png" alt="Jubiläumslogo" />
      <h1>BRING’S MIT!</h1><p>4 TEAMS · 15 GEGENSTÄNDE · WER ZUERST BRINGT, PUNKTET</p>
    </header>
    <nav aria-label="Hauptnavigation"><div className="tabs">
      {([['play', 'Spielfeld'], ['settings', 'Teams & Gegenstände'], ['history', 'Rundenverlauf']] as const).map(([id, label]) => <button key={id} className={screen === id ? 'selected' : ''} onClick={() => setScreen(id)}>{label}</button>)}
    </div><div className="actions"><button disabled={!game.results.length} onClick={undo}>↶ Letzte Wertung zurücknehmen</button></div></nav>
    {notice && <div role="status" className="warning">{notice}<button onClick={() => setNotice('')}>Schließen</button></div>}
    <main>
      {screen === 'play' && <>
        <div className="board-heading"><div><span className="eyebrow">DAS GROSSE SUCHSPIEL</span><h2>{complete ? 'Alle Gegenstände sind gefunden.' : `Runde ${game.results.length + 1} von 15`}</h2></div><span className="round-count">{game.results.length} / 15 gespielt</span></div>
        <div className="round-track" aria-label="Rundenfortschritt">{game.items.map((_, i) => <div key={i} className={`round-step ${i < game.results.length ? 'done' : i === game.results.length ? 'current' : ''}`} aria-label={`Runde ${i + 1}${i < game.results.length ? ' abgeschlossen' : ''}`}>{i < game.results.length ? '✓' : i + 1}</div>)}</div>
        <section className="question-view hunt-stage" aria-live="polite">
          <div className="question-meta"><span>{complete ? 'FINALE' : 'SUCHEN. BRINGEN. PUNKTEN.'}</span><span>1 PUNKT PRO RUNDE</span></div>
          {complete ? <><div className="stage-icon">♛</div><span className="eyebrow">{leaders.length === 1 ? 'GEWONNEN HAT' : 'GLEICHSTAND AN DER SPITZE'}</span><h2>{game.names.map((_, i) => i).filter(i => scores[i] === Math.max(...scores)).map(name).join(' & ')}</h2><p>Mit {Math.max(...scores)} {Math.max(...scores) === 1 ? 'Punkt' : 'Punkten'} auf dem ersten Platz. Danke fürs Mitspielen!</p><button className="gold" onClick={reset}>Noch eine Runde spielen</button></> : game.active ? <><div className="item-reveal"><img className="item-image" src={game.images[game.results.length]} alt={game.items[game.results.length]} /><div><span className="eyebrow">BRINGT JETZT …</span><h2>{game.items[game.results.length]}</h2></div></div><p>Wer den Gegenstand zuerst zur Spielleitung bringt, bekommt einen Punkt.</p><div className="winner-label">WER WAR ZUERST DA?</div><div className="winner-buttons">{game.names.map((_, i) => <button key={i} onClick={() => award(i)}><span className="team-dot" style={{ background: colors[i] }}/>{name(i)} <strong>+1</strong></button>)}</div><button className="skip" onClick={() => { if (window.confirm('Diese Runde ohne Punkt überspringen?')) award(null); }}>Niemand gefunden · Runde überspringen</button></> : <><div className="stage-icon">✦</div><span className="eyebrow">{game.results.length ? 'BEREIT FÜR DIE NÄCHSTE RUNDE?' : 'ALLE VIER BEREIT?'}</span><h2>{game.results.length ? 'Der nächste Gegenstand wartet.' : 'Auf die Plätze. Fertig. Suchen!'}</h2><p>Ein Spieler pro Team. Der Gegenstand wird für alle gleichzeitig aufgedeckt.</p>{game.results.length > 0 && <div className="last-result">Runde {game.results.length}: {game.results.at(-1) === null ? 'Kein Punkt vergeben' : `${name(game.results.at(-1)!)} holt den Punkt!`}</div>}<button className="gold reveal-button" onClick={() => setGame(g => g.active || g.results.length >= 15 ? g : { ...g, active: true })}>Runde {game.results.length + 1} starten <span>→</span></button></>}
        </section><div className="board-footer"><span><i/> Die Spielleitung vergibt den Punkt nach der Ankunft.</span><span>Gegenstände erst zum Rundenstart aufdecken.</span></div>
      </>}
      {screen === 'settings' && <section className="panel"><span className="eyebrow">SPIEL VORBEREITEN</span><h2>Vier Teams. Je eine Person.</h2><p>Trage die Namen der Mitspielenden ein. Die Gegenstände kannst du vor dem Spiel anpassen.</p><div className="team-editor">{game.names.map((n, i) => <label key={i}>Team {i + 1}<input maxLength={40} value={n} placeholder={`Team ${i + 1}`} onChange={e => setGame(g => ({ ...g, names: g.names.map((v, j) => j === i ? e.target.value : v) }))}/></label>)}</div><h2>Die 15 Gegenstände</h2><p>{locked ? 'Die Gegenstände sind während des Spiels gesperrt. Starte ein neues Spiel, um sie zu bearbeiten.' : 'Wähle Dinge, die am Veranstaltungsort zu finden sind. Diese Liste ist nur für die Spielleitung gedacht.'}</p><div className="items-editor">{game.items.map((item, i) => <div className="item-editor-card" key={i}><img className="item-thumbnail" src={game.images[i]} alt=""/><label>Runde {i + 1}<input disabled={locked} maxLength={120} value={item} onChange={e => setGame(g => ({ ...g, items: g.items.map((v, j) => j === i ? e.target.value : v) }))} onBlur={() => setGame(g => ({ ...g, items: g.items.map((v, j) => j === i && !v.trim() ? defaults[i] : v) }))}/></label><label>Bild für Runde {i + 1}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={locked} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file, i); e.target.value = ""; }}/></label><button disabled={locked || game.images[i] === defaultImages[i]} onClick={() => setGame(g => ({ ...g, images: g.images.map((v, j) => j === i ? defaultImages[i] : v) }))}>Standardbild verwenden</button></div>)}</div><button className="gold" onClick={() => setScreen('play')}>Zum Spielfeld</button></section>}
      {screen === 'history' && <section className="panel"><span className="eyebrow">SCHON GEFUNDEN</span><h2>Rundenverlauf</h2>{game.results.length ? <ol className="history">{game.results.map((r, i) => <li key={i}><span className="eyebrow">RUNDE {i + 1}</span><strong>{game.items[i]}</strong><span>{r === null ? 'Ohne Punkt' : `${name(r)} · +1 Punkt`}</span></li>)}</ol> : <p>Noch keine Runde gespielt. Starte die erste Runde auf dem Spielfeld.</p>}</section>}
    </main>
    <footer className="scoreboard"><div className="score-heading"><span className="eyebrow">PUNKTESTÄNDE</span><span className="score-tools">{complete ? 'Endstand' : 'Schnellster Gegenstand = 1 Punkt'}</span></div><div className="team-cards hunt-teams">{game.names.map((_, i) => <article className="team-card" key={i}><div className="team-name"><span className="team-dot" style={{ background: colors[i] }}/>{name(i)}</div><div className="score">{scores[i]}</div><div className="points-label">{scores[i] === 1 ? 'PUNKT' : 'PUNKTE'}</div></article>)}</div><div className="bottom-line"><span role="status">{storageError ? '⚠ Spielstand konnte nicht lokal gespeichert werden' : '● Spielstand lokal gespeichert'}</span></div></footer>
  </div>;
}
