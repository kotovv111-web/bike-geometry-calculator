export type Bike = {
  name: string;
  stack: number;
  reach: number;
  headAngle: number;
  seatAngle: number;
  headTube: number;
  seatTube: number;
  chainstay: number;
  bbDrop: number;
  wheelbase: number;
  wheelRadius: number;
  stemLength: number;
  stemAngle: number;
  spacers: number;
  headset: number;
  stemClamp: number;
};
export type Point = { x: number; y: number };
export const defaults: Bike[] = [
  {
    name: "Endurance · 54",
    stack: 575,
    reach: 380,
    headAngle: 72.5,
    seatAngle: 73.5,
    headTube: 165,
    seatTube: 500,
    chainstay: 415,
    bbDrop: 75,
    wheelbase: 1005,
    wheelRadius: 340,
    stemLength: 100,
    stemAngle: -6,
    spacers: 20,
    headset: 10,
    stemClamp: 40,
  },
  {
    name: "Race · 54",
    stack: 545,
    reach: 388,
    headAngle: 73,
    seatAngle: 74,
    headTube: 135,
    seatTube: 490,
    chainstay: 410,
    bbDrop: 70,
    wheelbase: 985,
    wheelRadius: 340,
    stemLength: 110,
    stemAngle: -6,
    spacers: 10,
    headset: 10,
    stemClamp: 40,
  },
];
export const fields: {
  key: Exclude<keyof Bike, "name">;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}[] = [
  { key: "stack", label: "Stack рами", min: 300, max: 800 },
  { key: "reach", label: "Reach рами", min: 250, max: 600 },
  {
    key: "headAngle",
    label: "Кут рульової",
    min: 55,
    max: 85,
    step: 0.1,
    unit: "°",
  },
  {
    key: "seatAngle",
    label: "Кут підсідельної",
    min: 60,
    max: 85,
    step: 0.1,
    unit: "°",
  },
  { key: "headTube", label: "Рульова труба", min: 60, max: 300 },
  { key: "seatTube", label: "Підсідельна труба", min: 200, max: 700 },
  { key: "chainstay", label: "Нижні пера", min: 300, max: 600 },
  { key: "bbDrop", label: "Опускання каретки", min: 0, max: 120 },
  { key: "wheelbase", label: "Колісна база", min: 800, max: 1500 },
  { key: "wheelRadius", label: "Радіус колеса", min: 250, max: 400 },
  { key: "stemLength", label: "Довжина виносу", min: 30, max: 180 },
  {
    key: "stemAngle",
    label: "Кут виносу",
    min: -35,
    max: 35,
    step: 0.5,
    unit: "°",
  },
  { key: "spacers", label: "Проставки", min: 0, max: 60 },
  { key: "headset", label: "Кришка рульової", min: 0, max: 40 },
  { key: "stemClamp", label: "Висота затискача", min: 20, max: 60 },
];
const rad = (d: number) => (d * Math.PI) / 180;
export function calculate(b: Bike) {
  for (const f of fields)
    if (!Number.isFinite(b[f.key]) || b[f.key] < f.min || b[f.key] > f.max)
      throw new Error(`Некоректне поле: ${f.label}`);
  const ha = rad(b.headAngle),
    sa = rad(b.seatAngle);
  const headTop = { x: b.reach, y: b.stack },
    headBottom = {
      x: b.reach + b.headTube * Math.cos(ha),
      y: b.stack - b.headTube * Math.sin(ha),
    };
  const rise = b.spacers + b.headset + b.stemClamp / 2;
  const stemBase = {
    x: b.reach - rise * Math.cos(ha),
    y: b.stack + rise * Math.sin(ha),
  };
  const stemPitch = 90 - b.headAngle + b.stemAngle;
  const bar = {
    x: stemBase.x + b.stemLength * Math.cos(rad(stemPitch)),
    y: stemBase.y + b.stemLength * Math.sin(rad(stemPitch)),
  };
  const rear = { x: -Math.sqrt(b.chainstay ** 2 - b.bbDrop ** 2), y: b.bbDrop },
    front = { x: rear.x + b.wheelbase, y: b.bbDrop };
  const seat = { x: -b.seatTube * Math.cos(sa), y: b.seatTube * Math.sin(sa) };
  const effectiveTopTube = b.reach + b.stack / Math.tan(sa);
  const forkOffset =
    (front.x - headBottom.x) * Math.sin(ha) +
    (front.y - headBottom.y) * Math.cos(ha);
  const trail = (b.wheelRadius * Math.cos(ha) - forkOffset) / Math.sin(ha);
  return {
    headTop,
    headBottom,
    stemBase,
    bar,
    rear,
    front,
    seat,
    effectiveTopTube,
    forkOffset,
    trail,
    stemPitch,
  };
}
