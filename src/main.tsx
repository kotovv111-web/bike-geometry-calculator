import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { calculate, defaults, fields, type Bike, type Point } from "./geometry";
import "./style.css";
const colors = ["#137c67", "#d57a3d"];
const fmt = (n: number) => n.toFixed(1);
function App() {
  const [bikes, setBikes] = useState<Bike[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem("bike-fit-v1") || "null");
      if (
        Array.isArray(v) &&
        v.length === 2 &&
        v.every((b) => typeof b.name === "string")
      ) {
        v.forEach(calculate);
        return v;
      }
    } catch {}
    return defaults.map((b) => ({ ...b }));
  });
  const [active, setActive] = useState(0),
    [overlay, setOverlay] = useState(true),
    [dimensions, setDimensions] = useState(true),
    [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const update = (index: number, patch: Partial<Bike>) => {
    const next = bikes.map((b, i) => (i === index ? { ...b, ...patch } : b));
    setBikes(next);
    try {
      localStorage.setItem("bike-fit-v1", JSON.stringify(next));
      setNotice("");
    } catch {
      setNotice("Браузер не дозволяє зберегти дані локально.");
    }
  };
  const geometry = bikes.map(calculate),
    g = geometry[active],
    b = bikes[active];
  const selected = overlay ? [0, 1] : [active];
  const minX =
    Math.min(
      ...selected.map((i) => geometry[i].rear.x - bikes[i].wheelRadius),
    ) - 80;
  const maxX =
    Math.max(
      ...selected.map((i) =>
        Math.max(geometry[i].front.x + bikes[i].wheelRadius, geometry[i].bar.x),
      ),
    ) + 80;
  const minY =
    Math.min(...selected.map((i) => bikes[i].bbDrop - bikes[i].wheelRadius)) -
    70;
  const maxY =
    Math.max(
      ...selected.map((i) => Math.max(geometry[i].bar.y, geometry[i].seat.y)),
    ) + 120;
  const line = (p: Point, q: Point, cls?: string) => (
    <line x1={p.x} y1={-p.y} x2={q.x} y2={-q.y} className={cls} />
  );
  const metrics = [
    ["Stack рами", bikes[0].stack, bikes[1].stack],
    ["Reach рами", bikes[0].reach, bikes[1].reach],
    ["Висота центра керма", geometry[0].bar.y, geometry[1].bar.y],
    ["Виліт центра керма", geometry[0].bar.x, geometry[1].bar.x],
    [
      "Ефективна верхня труба",
      geometry[0].effectiveTopTube,
      geometry[1].effectiveTopTube,
    ],
    ["Колісна база", bikes[0].wheelbase, bikes[1].wheelbase],
    ["Трейл (розрахунковий)", geometry[0].trail, geometry[1].trail],
  ] as const;
  return (
    <>
      <header>
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            V
          </span>{" "}
          <span>
            VELO<span className="brand-light"> / FIT LAB</span>
          </span>
        </a>
        <span className="header-note">ГЕОМЕТРІЯ. ПОСАДКА. БАЛАНС.</span>
        <span className="version">Калькулятор v0.1</span>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">ВАША ПОСАДКА ПОЧИНАЄТЬСЯ З ГЕОМЕТРІЇ</div>
            <h1>
              Знайдіть свою <em>точку балансу.</em>
            </h1>
            <p>
              Порівнюйте рами. Налаштовуйте кокпіт. Побачте різницю до першої
              поїздки.
            </p>
          </div>
          <button
            className="reset"
            onClick={() => {
              setDrafts({});
              setBikes(defaults.map((b) => ({ ...b })));
              try {
                localStorage.removeItem("bike-fit-v1");
              } catch {}
              setNotice("Початкові приклади відновлено.");
            }}
          >
            ↺ Скинути приклади
          </button>
        </div>
        <div className="workspace">
          <aside className="panel editor">
            <div className="tabs" role="tablist" aria-label="Вибір велосипеда">
              {bikes.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={active === i}
                  className={active === i ? "selected" : ""}
                  onClick={() => setActive(i)}
                >
                  <i style={{ background: colors[i] }} />
                  Велосипед {i === 0 ? "A" : "B"}
                </button>
              ))}
            </div>
            <label className="name-label">
              Назва велосипеда
              <input
                maxLength={60}
                value={b.name}
                onChange={(e) => update(active, { name: e.target.value })}
              />
            </label>
            {[
              ["01", "Геометрія рами", fields.slice(0, 10)],
              ["02", "Винос і проставки", fields.slice(10)],
            ].map(([num, title, fs]) => (
              <section className="input-section" key={String(num)}>
                <h2>
                  <span>{String(num)}</span>
                  {String(title)}
                </h2>
                <div className="fields">
                  {(fs as typeof fields).map((f) => {
                    const key = `${active}-${f.key}`,
                      raw = drafts[key] ?? String(b[f.key]);
                    const invalid =
                      raw.trim() === "" ||
                      !Number.isFinite(Number(raw)) ||
                      Number(raw) < f.min ||
                      Number(raw) > f.max;
                    return (
                      <label key={f.key}>
                        {f.label}
                        <div
                          className={"input-wrap " + (invalid ? "invalid" : "")}
                        >
                          <input
                            type="number"
                            aria-label={f.label}
                            min={f.min}
                            max={f.max}
                            step={f.step ?? 1}
                            value={raw}
                            aria-invalid={invalid}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDrafts((d) => ({ ...d, [key]: value }));
                              if (
                                value.trim() !== "" &&
                                Number.isFinite(Number(value)) &&
                                Number(value) >= f.min &&
                                Number(value) <= f.max
                              )
                                update(active, { [f.key]: Number(value) });
                            }}
                          />
                          <span>{f.unit ?? "мм"}</span>
                        </div>
                        {invalid && (
                          <small role="alert">
                            Введіть {f.min}–{f.max}; креслення показує останнє
                            коректне значення.
                          </small>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
            <p className="editor-foot">
              Усі довжини в мм. Зміни зберігаються у цьому браузері.
            </p>
          </aside>
          <div className="results">
            <section className="panel drawing">
              <div className="drawing-heading">
                <div>
                  <div className="eyebrow">ІНТЕРАКТИВНА ГЕОМЕТРІЯ</div>
                  <h2>Дві рами. Одна система координат.</h2>
                </div>
                <span className="live">● Наживо</span>
              </div>
              <div className="toolbar">
                <label>
                  <input
                    type="checkbox"
                    checked={overlay}
                    onChange={(e) => setOverlay(e.target.checked)}
                  />{" "}
                  Порівняти A + B
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={dimensions}
                    onChange={(e) => setDimensions(e.target.checked)}
                  />{" "}
                  Розміри
                </label>
                <span>Суміщення за кареткою</span>
              </div>
              <svg
                className="bike-svg"
                viewBox={`${minX} ${-maxY} ${maxX - minX} ${maxY - minY}`}
                role="img"
                aria-label="Порівняльне креслення геометрії велосипедів, суміщених за центром каретки"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="#dce4df"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect
                  x={minX}
                  y={-maxY}
                  width={maxX - minX}
                  height={maxY - minY}
                  fill="url(#grid)"
                />
                <line x1={minX} x2={maxX} y1="0" y2="0" className="axis" />
                <line x1="0" x2="0" y1={-maxY} y2={-minY} className="axis" />
                {selected.map((i) => {
                  const c = geometry[i],
                    bike = bikes[i];
                  return (
                    <g
                      key={i}
                      stroke={colors[i]}
                      fill="none"
                      opacity={i === active ? 1 : 0.48}
                      strokeWidth="6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray={i === active ? undefined : "12 8"}
                    >
                      {[c.rear, c.front].map((p, j) => (
                        <g key={j} strokeWidth="3">
                          <circle cx={p.x} cy={-p.y} r={bike.wheelRadius} />
                          <circle cx={p.x} cy={-p.y} r="9" />
                        </g>
                      ))}
                      {line(c.rear, c.seat)}
                      {line(c.seat, { x: 0, y: 0 })}
                      {line({ x: 0, y: 0 }, c.rear)}
                      {line(c.seat, c.headTop)}
                      {line({ x: 0, y: 0 }, c.headBottom)}
                      {line(c.headTop, c.headBottom)}
                      {line(c.headBottom, c.front)}
                      <g strokeWidth="9">
                        {line(c.headTop, c.stemBase)}
                        {line(c.stemBase, c.bar)}
                      </g>
                      <circle
                        cx={c.bar.x}
                        cy={-c.bar.y}
                        r="10"
                        fill={colors[i]}
                        stroke="white"
                        strokeWidth="3"
                      />
                      <circle cx="0" cy="0" r="16" strokeWidth="4" />
                    </g>
                  );
                })}
                {dimensions && (
                  <g
                    className="dimensions"
                    fill="none"
                    stroke={colors[active]}
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  >
                    {line({ x: 0, y: 0 }, { x: 0, y: b.stack })}
                    {line({ x: 0, y: b.stack }, g.headTop)}
                    {line(g.headTop, { x: b.reach, y: 0 })}
                    <g
                      fill={colors[active]}
                      stroke="none"
                      fontSize="22"
                      fontWeight="600"
                    >
                      <text x="-15" y={-b.stack / 2} textAnchor="end">
                        Stack {b.stack}
                      </text>
                      <text
                        x={b.reach / 2}
                        y={-b.stack - 18}
                        textAnchor="middle"
                      >
                        Reach {b.reach}
                      </text>
                      <text x={g.bar.x + 20} y={-g.bar.y - 18}>
                        Кермо {fmt(g.bar.x)} / {fmt(g.bar.y)}
                      </text>
                    </g>
                  </g>
                )}
                <circle cx="0" cy="0" r="5" fill="#223e33" />
                <text x="22" y="35" fill="#6b7d72" fontSize="20">
                  BB · 0, 0
                </text>
              </svg>
              <div className="legend">
                {bikes.map((bike, i) => (
                  <span key={i}>
                    <i style={{ background: colors[i] }} />
                    {i === 0 ? "A" : "B"} · {bike.name || "Без назви"}
                  </span>
                ))}
                <span className="legend-note">Схематичний вигляд збоку</span>
              </div>
            </section>
            <div className="stats">
              <article>
                <span>STACK РАМИ · {active === 0 ? "A" : "B"}</span>
                <strong>
                  {b.stack}
                  <small>мм</small>
                </strong>
                <p>До верху рульової труби</p>
              </article>
              <article>
                <span>REACH РАМИ · {active === 0 ? "A" : "B"}</span>
                <strong>
                  {b.reach}
                  <small>мм</small>
                </strong>
                <p>Від центра каретки</p>
              </article>
              <article className="accent">
                <span>ЦЕНТР ЗАТИСКАЧА КЕРМА</span>
                <strong>
                  {fmt(g.bar.x)}
                  <small> / </small>
                  {fmt(g.bar.y)}
                </strong>
                <p>Горизонталь / вертикаль, мм</p>
              </article>
            </div>
            <section className="panel comparison">
              <div className="comparison-title">
                <h2>Різниця в деталях</h2>
                <span>B − A · усі значення в мм</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Параметр</th>
                      <th>
                        <i style={{ background: colors[0] }} />
                        Велосипед A
                      </th>
                      <th>
                        <i style={{ background: colors[1] }} />
                        Велосипед B
                      </th>
                      <th>Різниця</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(([name, a, b]) => (
                      <tr key={name}>
                        <th>{name}</th>
                        <td>{fmt(a)}</td>
                        <td>{fmt(b)}</td>
                        <td className="delta">
                          {b - a > 0 ? "+" : ""}
                          {fmt(b - a)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="comparison-note">
                Кермо B на{" "}
                {fmt(Math.abs(geometry[1].bar.y - geometry[0].bar.y))} мм{" "}
                {geometry[1].bar.y >= geometry[0].bar.y ? "вище" : "нижче"} та
                на {fmt(Math.abs(geometry[1].bar.x - geometry[0].bar.x))} мм{" "}
                {geometry[1].bar.x >= geometry[0].bar.x
                  ? "далі вперед"
                  : "ближче"}{" "}
                відносно A.
              </p>
            </section>
          </div>
        </div>
        <details className="method">
          <summary>Як читати розрахунки та які припущення використано</summary>
          <p>
            Початок координат — центр каретки. X спрямований вперед, Y — вгору.
            Stack і Reach рами вводяться за даними виробника та не змінюються
            від проставок. Кут виносу задається від перпендикуляра до рульової
            осі: від’ємний кут опускає винос.
          </p>
          <p>
            До висоти проставок уздовж рульової осі додаються кришка рульової та
            половина висоти затискача виносу. Положення керма — центр його
            затискача, без урахування форми керма, reach ручок і положення
            долонь. Підсідельна труба вимірюється від каретки до її верху.
            Ефективна верхня труба розрахована з прямої підсідельної осі.
          </p>
          <p>
            Винос вилки й трейл виводяться з колісної бази, нижніх пер,
            опускання каретки, рульової труби та радіуса коліс. Незвичні
            поєднання можуть давати від’ємні або нереалістичні значення —
            звіряйте їх з даними виробника. Обидва колеса мають однаковий
            радіус. Креслення не моделює сідло, провисання підвіски чи безпечну
            максимальну висоту проставок; її визначає виробник вилки. Це
            геометричне порівняння, а не персональна рекомендація посадки.
          </p>
        </details>
        <p role="status">{notice}</p>
        <footer>
          VELO / FIT LAB <span>Зрозумійте геометрію. Відчуйте різницю.</span>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
