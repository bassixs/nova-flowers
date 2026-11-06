import { bloomColors } from '../config/theme';
import type { BloomRenderer } from './types';
import { clamp, easeInOut, lerp, remap, smooth } from './types';

/**
 * ПРОЦЕДУРНЫЙ ПИОН — временная замена покадровой съёмки.
 *
 * Это не CSS-трансформация фотографии: каждый лепесток — изогнутая 3D-поверхность
 * (позвоночник + ширина + чашевидный изгиб + волнистая кромка), которая
 * поворачивается вокруг своего основания. Слои раскрываются с задержкой
 * от внешних к внутренним, камера одновременно приближается и наклоняется.
 * Отрисовка — перспективная проекция + сортировка по глубине (painter's algorithm)
 * + освещение по нормали, градиенты и окклюзия у основания.
 */

type V3 = [number, number, number];
type RGB = readonly [number, number, number];

interface Pose {
  t0: number; // наклон основания лепестка от вертикали, рад
  bend: number; // доп. изгиб к кончику, рад
  r0: number; // радиус крепления
  cup: number; // чашевидность
}

interface Petal {
  layer: number;
  sepal: boolean;
  phi: number;
  L: number;
  W: number;
  y0: number;
  closed: Pose;
  open: Pose;
  start: number;
  end: number;
  ruffle: number;
  seed: number;
  tint: number;
}

const DEG = Math.PI / 180;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Описание слоёв: от чашелистиков к самым внутренним лепесткам. */
const LAYERS = [
  // sepals
  { n: 5, L: 0.62, W: 0.34, closed: [86, -70, 0.12, 0.3], open: [104, 30, 0.14, 0.15], win: [0.0, 0.55], y0: -0.04, sepal: true },
  // внешние «охранные» лепестки: в бутоне — меридианы сферы, при раскрытии кончик разворачивается наружу
  { n: 5, L: 1.2, W: 0.8, closed: [88, -176, 0.06, 0.7], open: [86, 26, 0.16, 0.62], win: [0.04, 0.5] },
  { n: 7, L: 1.08, W: 0.62, closed: [86, -174, 0.05, 0.7], open: [70, 18, 0.15, 0.66], win: [0.12, 0.6] },
  { n: 9, L: 0.96, W: 0.5, closed: [84, -172, 0.05, 0.7], open: [54, 10, 0.13, 0.7], win: [0.2, 0.7] },
  { n: 11, L: 0.82, W: 0.4, closed: [82, -168, 0.04, 0.68], open: [40, 4, 0.11, 0.6], win: [0.28, 0.8] },
  { n: 13, L: 0.68, W: 0.32, closed: [78, -160, 0.04, 0.64], open: [26, -6, 0.09, 0.62], win: [0.36, 0.9] },
  { n: 12, L: 0.54, W: 0.26, closed: [70, -150, 0.03, 0.6], open: [14, -18, 0.06, 0.6], win: [0.44, 0.97] },
  { n: 14, L: 0.42, W: 0.21, closed: [60, -130, 0.02, 0.5], open: [4, -34, 0.04, 0.62], win: [0.5, 1.0] },
  { n: 10, L: 0.3, W: 0.17, closed: [40, -100, 0.01, 0.5], open: [-2, -40, 0.02, 0.7], win: [0.56, 1.0] },
] as const;

function buildPetals(): Petal[] {
  const r = rng(7);
  const petals: Petal[] = [];
  const golden = 137.508 * DEG;
  LAYERS.forEach((ly, li) => {
    for (let k = 0; k < ly.n; k++) {
      const pose = (a: readonly number[]): Pose => ({
        t0: (a[0] + (r() - 0.5) * 8) * DEG,
        bend: (a[1] + (r() - 0.5) * 10) * DEG,
        r0: a[2],
        cup: a[3] * (0.85 + r() * 0.3),
      });
      const jitter = (r() - 0.5) * 0.25;
      const winShift = (r() - 0.5) * 0.06;
      petals.push({
        layer: li,
        sepal: 'sepal' in ly && !!ly.sepal,
        phi: ((k + jitter) / ly.n) * Math.PI * 2 + li * golden,
        L: ly.L * (0.9 + r() * 0.2),
        W: ly.W * (0.88 + r() * 0.24),
        y0: ('y0' in ly ? ly.y0 : 0) + li * 0.012,
        closed: pose(ly.closed),
        open: pose(ly.open),
        start: clamp(ly.win[0] + winShift),
        end: clamp(ly.win[1] + winShift),
        ruffle: li < 2 ? 0.01 : 0.02 + r() * 0.04 + li * 0.012,
        seed: r() * 1000,
        tint: r(),
      });
    }
  });
  return petals;
}

const NV = 12; // сэмплов по длине лепестка

/** полуширина лепестка: узкое основание, широкая округлая верхушка */
function halfWidth(v: number) {
  return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(v, 1.45))), 0.62);
}

const mix = (a: RGB, b: RGB, t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const SHADOW: RGB = [96, 22, 48];
/** Затенение без «серости»: в тени цвет уходит в глубокий малиновый, на свету — в тёплый белый. */
const shade = (c: RGB, l: number): [number, number, number] =>
  l <= 1 ? mix(SHADOW, c, clamp(l, 0, 1)) : mix(c, [255, 248, 244], clamp(l - 1, 0, 1));
const rgba = (c: readonly number[], k = 1, a = 1) =>
  `rgba(${Math.round(clamp(c[0] * k, 0, 255))},${Math.round(clamp(c[1] * k, 0, 255))},${Math.round(clamp(c[2] * k, 0, 255))},${a})`;

export function createPeonyRenderer(): BloomRenderer {
  const petals = buildPetals();
  const lightDir = norm([-0.45, 0.75, 0.55]);

  return {
    ready: Promise.resolve(),
    animated: true,
    draw(ctx, w, h, sp, time) {
      // ---- таймлайн сцены (sp — прогресс прокрутки 0..1) ----
      // 0–20%: почти закрыт, лёгкое движение; 20–45%: внешние лепестки;
      // 45–75%: пышное раскрытие; 75–100%: финальная композиция.
      const bloomT =
        sp < 0.2
          ? lerp(0, 0.07, sp / 0.2)
          : sp < 0.45
            ? lerp(0.07, 0.42, smooth(remap(sp, 0.2, 0.45)))
            : sp < 0.75
              ? lerp(0.42, 0.93, smooth(remap(sp, 0.45, 0.75)))
              : lerp(0.93, 1, remap(sp, 0.75, 1));

      const cam = easeInOut(remap(sp, 0.12, 0.85));
      const pitch = lerp(10, 52, cam) * DEG;
      const yaw = (lerp(-18, 26, sp) + Math.sin(time * 0.25) * 1.2) * DEG;
      const minDim = Math.min(w, h);
      const portrait = h > w * 1.15;
      // камера: крупный бутон → отъезд, пока лепестки разворачиваются → мягкий наезд в финале
      const zBud = portrait ? 0.5 : 0.44, zMid = portrait ? 0.3 : 0.29, zEnd = portrait ? 0.36 : 0.335;
      const zoom =
        (sp < 0.45 ? lerp(zBud, zMid, smooth(remap(sp, 0.12, 0.45))) : lerp(zMid, zEnd, smooth(remap(sp, 0.45, 1)))) *
        (1 + 0.025 * Math.sin(time * 0.6) * (1 - sp));
      const scale = minDim * zoom;
      const D = 6.5;
      const cx = w * (portrait ? 0.5 : lerp(0.6, 0.64, cam));
      const cy = h * (portrait ? lerp(0.5, 0.58, cam) : 0.5) + scale * lerp(0.12, -0.05, cam);

      const cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const cp = Math.cos(pitch), spc = Math.sin(pitch);
      const toCam = (p: V3): V3 => {
        // yaw вокруг Y, затем pitch вокруг X (камера смотрит сверху-сбоку)
        const x1 = p[0] * cyw + p[2] * syw;
        const z1 = -p[0] * syw + p[2] * cyw;
        const y1 = p[1] - 0.45;
        const y2 = y1 * cp - z1 * spc;
        const z2 = y1 * spc + z1 * cp;
        return [x1, y2, z2];
      };
      const project = (c: V3): [number, number] => {
        const k = D / (D - c[2]);
        return [cx + c[0] * scale * k, cy - c[1] * scale * k];
      };

      // ---- фон: мягкий свет, который теплеет по ходу сцены ----
      ctx.clearRect(0, 0, w, h);
      const warm = smooth(remap(sp, 0.05, 0.6));
      const bg = ctx.createRadialGradient(cx - scale * 0.4, cy - scale * 1.1, 0, cx, cy, Math.max(w, h) * 0.85);
      bg.addColorStop(0, rgba(mix([250, 246, 240], [255, 238, 226], warm)));
      bg.addColorStop(0.45, rgba(mix([240, 233, 224], [244, 226, 216], warm)));
      bg.addColorStop(1, rgba(mix([214, 206, 194], [222, 200, 190], warm)));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // мягкая тень под цветком
      const shadowC = project(toCam([0, -0.3, 0]));
      ctx.save();
      ctx.translate(shadowC[0], shadowC[1] + scale * 0.25);
      ctx.scale(1, 0.32 + cam * 0.4);
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, scale * (1 + bloomT * 1.3));
      sh.addColorStop(0, 'rgba(90,60,50,0.18)');
      sh.addColorStop(1, 'rgba(90,60,50,0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.arc(0, 0, scale * (1 + bloomT * 1.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ---- стебель ----
      const stemTop = project(toCam([0, -0.02, 0]));
      const stemBot = project(toCam([0.5, -4.5, 0.1]));
      const stemMid = project(toCam([-0.15, -2.2, 0.05]));
      ctx.strokeStyle = rgba(bloomColors.stem, 0.85);
      ctx.lineCap = 'round';
      ctx.lineWidth = scale * 0.05;
      ctx.beginPath();
      ctx.moveTo(stemTop[0], stemTop[1]);
      ctx.quadraticCurveTo(stemMid[0], stemMid[1], stemBot[0], stemBot[1]);
      ctx.stroke();

      // ---- построение лепестков ----
      type Item = { depth: number; draw: () => void };
      const items: Item[] = [];

      for (const pt of petals) {
        const o = easeInOut(remap(bloomT, pt.start, pt.end));
        const breathe = Math.sin(time * 0.9 + pt.seed) * 1.4 * DEG * (0.4 + 0.6 * (1 - o));
        const t0 = lerp(pt.closed.t0, pt.open.t0, o) + breathe;
        const bend = lerp(pt.closed.bend, pt.open.bend, o);
        const r0 = lerp(pt.closed.r0, pt.open.r0, o);
        const cup = lerp(pt.closed.cup, pt.open.cup, o);
        const L = pt.L * lerp(0.8, 1, o) * (pt.sepal ? 1 : lerp(0.92, 1, bloomT));
        const W = pt.W * lerp(1, 1.05, o);

        const bendPow = lerp(1, 1.35, o);
        const wrapK = pt.sepal ? 0.3 * (1 - o) : lerp(0.92, 0.18 + 0.5 * (pt.layer / LAYERS.length), o);
        const R: V3 = [Math.cos(pt.phi), 0, Math.sin(pt.phi)];
        const T: V3 = [-Math.sin(pt.phi), 0, Math.cos(pt.phi)];

        // позвоночник
        const spine: V3[] = [];
        const nrm: V3[] = [];
        const dirs: V3[] = [];
        let pos: V3 = [R[0] * r0, pt.y0, R[2] * r0];
        for (let j = 0; j <= NV; j++) {
          const v = j / NV;
          const th = t0 + bend * Math.pow(v, bendPow);
          const st = Math.sin(th), ct = Math.cos(th);
          const d: V3 = [st * R[0], ct, st * R[2]];
          spine.push(pos);
          dirs.push(d);
          nrm.push([-ct * R[0], st, -ct * R[2]]); // внутренняя сторона
          pos = [pos[0] + d[0] * (L / NV), pos[1] + d[1] * (L / NV), pos[2] + d[2] * (L / NV)];
        }

        const surf = (u: number, j: number): V3 => {
          const v = j / NV;
          const hw = halfWidth(v) * W;
          const x = u * hw;
          const n = nrm[j];
          const ruf = pt.ruffle * Math.sin(u * 7 + pt.seed + v * 3) * Math.pow(v, 2) * 1.0;
          const c = cup * (x * x) / Math.max(W, 0.001) + ruf;
          const s = spine[j];
          const flat: V3 = [s[0] + T[0] * x + n[0] * c, s[1] + n[1] * c, s[2] + T[2] * x + n[2] * c];
          if (wrapK < 0.01) return flat;
          // обёртывание вокруг оси цветка: в бутоне лепесток лежит на сфере, а не торчит плоскостью
          const rho = Math.max(0.03, Math.hypot(s[0], s[2]));
          const a = clamp(x / rho, -2.3, 2.3);
          const wr: V3 = [rho * Math.cos(pt.phi + a) + n[0] * ruf, s[1] + n[1] * ruf, rho * Math.sin(pt.phi + a) + n[2] * ruf];
          return [lerp(flat[0], wr[0], wrapK), lerp(flat[1], wr[1], wrapK), lerp(flat[2], wr[2], wrapK)];
        };

        // контур: левый край снизу вверх, затем правый сверху вниз
        const outline: V3[] = [];
        for (let j = 0; j <= NV; j++) outline.push(surf(-1, j));
        for (let j = NV; j >= 0; j--) outline.push(surf(1, j));

        const camPts = outline.map(toCam);
        const scr = camPts.map(project);
        const midJ = Math.round(NV * 0.55);
        const midC = toCam(spine[midJ]);

        // нормаль поверхности в середине лепестка
        const nIn = toCamDir(nrm[midJ], cyw, syw, cp, spc);
        const facing = nIn[2] > 0; // видим внутреннюю (верхнюю) сторону
        const N = facing ? nIn : [-nIn[0], -nIn[1], -nIn[2]];
        const diff = Math.max(0, dot(N as V3, lightDir));
        const layerDepth = pt.layer / (LAYERS.length - 1);
        const ao = 1 - 0.38 * layerDepth * (1 - o * 0.55) - (pt.sepal ? 0 : 0.08 * (1 - bloomT));
        const light = (0.66 + 0.46 * diff) * ao;

        const baseP = project(toCam(spine[0]));
        const tipP = project(toCam(spine[NV]));
        const len = Math.hypot(tipP[0] - baseP[0], tipP[1] - baseP[1]);
        // кончики «просвечивают» — подсветка кромки
        const rim = facing ? 1 : 1.06;

        const shOff = minDim * 0.004;
        const tracePath = () => {
          ctx.beginPath();
          ctx.moveTo(scr[0][0], scr[0][1]);
          for (let i = 1; i < scr.length - 1; i++) {
            const mx = (scr[i][0] + scr[i + 1][0]) / 2;
            const my = (scr[i][1] + scr[i + 1][1]) / 2;
            ctx.quadraticCurveTo(scr[i][0], scr[i][1], mx, my);
          }
          ctx.closePath();
        };
        const draw = () => {
          // мягкая падающая тень на нижележащие лепестки
          if (!pt.sepal) {
            ctx.save();
            ctx.translate(shOff * 0.6, shOff * 1.4);
            tracePath();
            ctx.fillStyle = `rgba(110,28,52,${0.16 * (0.5 + o * 0.5)})`;
            ctx.fill();
            ctx.restore();
          }
          tracePath();

          const g = ctx.createLinearGradient(baseP[0], baseP[1], tipP[0], tipP[1]);
          if (pt.sepal) {
            g.addColorStop(0, rgba(bloomColors.sepal, light * 0.8));
            g.addColorStop(1, rgba(mix(bloomColors.sepal, [120, 150, 110], 0.4), light));
          } else {
            const tv = pt.tint * 0.18;
            const base = mix(bloomColors.petalBase, bloomColors.petalMid, facing ? tv : 0.35 + tv);
            const mid = mix(bloomColors.petalMid, bloomColors.petalTip, facing ? 0.15 + tv : 0.4 + tv);
            const tip = mix(bloomColors.petalTip, [255, 246, 243], facing ? 0.2 : 0.5);
            g.addColorStop(0, rgba(shade(base, light * 0.78)));
            g.addColorStop(0.45, rgba(shade(mid, light)));
            g.addColorStop(1, rgba(shade(tip, light * rim * 1.04)));
          }
          ctx.fillStyle = g;
          ctx.fill();

          // окклюзия у основания
          if (!pt.sepal && len > 2) {
            const occ = ctx.createRadialGradient(baseP[0], baseP[1], 0, baseP[0], baseP[1], len * 0.75);
            occ.addColorStop(0, `rgba(90,18,40,${0.32 * (1 - o * 0.4)})`);
            occ.addColorStop(1, 'rgba(90,18,40,0)');
            ctx.fillStyle = occ;
            ctx.fill();
          }

          // прожилки — только на крупных лепестках
          if (!pt.sepal && len > minDim * 0.05) {
            ctx.save();
            ctx.clip();
            ctx.strokeStyle = `rgba(255,240,242,${(facing ? 0.14 : 0.18) * (0.35 + 0.65 * o)})`;
            ctx.lineWidth = Math.max(0.6, len * 0.006);
            for (let s = -2; s <= 2; s++) {
              ctx.beginPath();
              for (let j = 1; j <= NV; j++) {
                const pp = project(toCam(surf(s * 0.32, j)));
                if (j === 1) ctx.moveTo(pp[0], pp[1]);
                else ctx.lineTo(pp[0], pp[1]);
              }
              ctx.stroke();
            }
            ctx.restore();
          }

          // тонкая светлая кромка
          tracePath();
          const edgeA = clamp(len / (minDim * 0.12), 0.15, 1);
          ctx.strokeStyle = pt.sepal ? 'rgba(30,50,35,0.25)' : `rgba(255,240,240,${(facing ? 0.32 : 0.45) * edgeA})`;
          ctx.lineWidth = Math.max(0.6, minDim * 0.0012);
          ctx.stroke();
        };

        items.push({ depth: midC[2] + (pt.sepal ? -0.05 : 0) + layerDepth * 0.02, draw });
      }

      items.sort((a, b) => a.depth - b.depth);
      for (const it of items) it.draw();

      // тёплый световой «блик» в центре раскрытого цветка
      if (bloomT > 0.5) {
        const c = project(toCam([0, 0.55, 0]));
        const gl = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], scale * 0.6);
        gl.addColorStop(0, `rgba(255,230,210,${0.18 * remap(bloomT, 0.5, 1)})`);
        gl.addColorStop(1, 'rgba(255,230,210,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(c[0] - scale, c[1] - scale, scale * 2, scale * 2);
      }
    },
  };
}

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function dot(a: V3, b: V3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function toCamDir(p: V3, cyw: number, syw: number, cp: number, spc: number): V3 {
  const x1 = p[0] * cyw + p[2] * syw;
  const z1 = -p[0] * syw + p[2] * cyw;
  const y2 = p[1] * cp - z1 * spc;
  const z2 = p[1] * spc + z1 * cp;
  return [x1, y2, z2];
}
