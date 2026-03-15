import React from 'react';

/**
 * WireframeCanvas — renders a page wireframe as an SVG.
 * Each section uses its own `style` object from the LLM (bg, textColor,
 * accentColor, borderColor, borderRadius, padding, gap, fontFamily, fontSize, fontWeight).
 */

// Safe accessor — always returns a usable style even if LLM omits keys
function getStyle(section) {
  const s = section.style || {};
  return {
    bg:           s.bg           || '#1c1c28',
    textColor:    s.textColor    || '#c0c0d0',
    accentColor:  s.accentColor  || '#6c63ff',
    borderColor:  s.borderColor  || '#2a2a3c',
    borderRadius: Number(s.borderRadius) || 8,
    padding:      Number(s.padding)      || 20,
    gap:          Number(s.gap)          || 14,
    fontFamily:   s.fontFamily   || 'Inter',
    fontSize:     Number(s.fontSize)     || 14,
    fontWeight:   String(s.fontWeight)   || '400',
  };
}

// Lighten / darken a hex colour by a ratio (positive = lighten)
function shadeColor(hex, ratio) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  if (ratio > 0) {
    r = Math.min(255, Math.round(r + (255 - r) * ratio));
    g = Math.min(255, Math.round(g + (255 - g) * ratio));
    b = Math.min(255, Math.round(b + (255 - b) * ratio));
  } else {
    r = Math.max(0, Math.round(r * (1 + ratio)));
    g = Math.max(0, Math.round(g * (1 + ratio)));
    b = Math.max(0, Math.round(b * (1 + ratio)));
  }
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/* ------------------------------------------------------------------ */
/* Placeholder shapes                                                  */
/* ------------------------------------------------------------------ */

function TextLine({ x, y, width, height = 10, fill, opacity = 0.3, scale, rx = 3 }) {
  return (
    <rect x={x * scale} y={y * scale} width={width * scale} height={height * scale}
      fill={fill} opacity={opacity} rx={rx * scale} />
  );
}

function Pill({ x, y, width, height, fill, stroke, text, textColor, fontSize, scale, fontFamily }) {
  return (
    <g>
      <rect x={x * scale} y={y * scale} width={width * scale} height={height * scale}
        fill={fill} stroke={stroke} strokeWidth={0.8} rx={(height / 2) * scale} />
      {text && (
        <text x={(x + width / 2) * scale} y={(y + height / 2 + fontSize * 0.35) * scale}
          fill={textColor} fontSize={fontSize * scale} textAnchor="middle"
          fontFamily={fontFamily} fontWeight="500"
          letterSpacing={0.3 * scale}>{text}</text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Section content renderer — uses style properties from LLM          */
/* ------------------------------------------------------------------ */

function renderSectionContent(section, scale) {
  const { type, label, description, width, height, x, y } = section;
  const st = getStyle(section);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const pad = st.padding;
  const gap = st.gap;
  const br = st.borderRadius;
  const ff = `'${st.fontFamily}', sans-serif`;
  const fs = st.fontSize * scale;
  const iconBg = shadeColor(st.bg, 0.08);
  const dimText = shadeColor(st.borderColor, 0.12);

  const els = [];

  /* --- Background --- */
  els.push(
    <g key="bg">
      <rect x={x * scale} y={y * scale} width={width * scale} height={height * scale}
        fill={st.bg} stroke={st.borderColor} strokeWidth={1.2}
        rx={br * scale} ry={br * scale} />
      {/* Subtle inner top highlight */}
      <rect x={(x + 2) * scale} y={(y + 1) * scale}
        width={(width - 4) * scale} height={2 * scale}
        fill={st.borderColor} opacity={0.35} rx={br * scale} />
    </g>
  );

  /* ================================================================ */
  /*  Type-specific content                                           */
  /* ================================================================ */

  if (type === 'navbar') {
    els.push(
      <g key="c">
        {/* Logo */}
        <rect x={(x + pad) * scale} y={(y + height / 2 - 14) * scale}
          width={90 * scale} height={28 * scale}
          fill={iconBg} stroke={st.borderColor} strokeWidth={0.8} rx={6 * scale} />
        <text x={(x + pad + 45) * scale} y={(y + height / 2 + 5) * scale}
          fill={st.accentColor} fontSize={12 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="600">LOGO</text>

        {/* Nav links */}
        {['Home', 'About', 'Services', 'Blog', 'Contact'].map((item, i) => (
          <text key={i}
            x={(x + width - 340 + i * 66) * scale}
            y={(y + height / 2 + 4) * scale}
            fill={st.textColor} fontSize={Math.min(13, st.fontSize) * scale}
            fontFamily={ff} fontWeight={st.fontWeight}>{item}</text>
        ))}

        {/* CTA */}
        <rect x={(x + width - pad - 100) * scale} y={(y + height / 2 - 16) * scale}
          width={100 * scale} height={32 * scale}
          fill={st.accentColor} rx={6 * scale} opacity={0.9} />
        <text x={(x + width - pad - 50) * scale} y={(y + height / 2 + 4) * scale}
          fill="#fff" fontSize={12 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="500">Get Started</text>
      </g>
    );
  } else if (type === 'hero') {
    const headingFs = Math.max(24, st.fontSize);
    els.push(
      <g key="c">
        {/* Badge pill */}
        <Pill x={cx - 55} y={y + pad + 20} width={110} height={26}
          fill={iconBg} stroke={st.accentColor} text="✦ NEW"
          textColor={st.accentColor} fontSize={9} scale={scale} fontFamily={ff} />

        {/* Headline placeholder bars */}
        <TextLine x={cx - 220} y={y + pad + 65} width={440} height={headingFs}
          fill={st.borderColor} opacity={0.8} scale={scale} rx={4} />
        <TextLine x={cx - 170} y={y + pad + 65 + headingFs + gap / 2} width={340} height={headingFs * 0.85}
          fill={st.borderColor} opacity={0.6} scale={scale} rx={4} />

        {/* Subtext */}
        <TextLine x={cx - 160} y={y + pad + 65 + headingFs * 2 + gap * 1.5} width={320} height={12}
          fill={st.borderColor} opacity={0.3} scale={scale} />
        <TextLine x={cx - 120} y={y + pad + 65 + headingFs * 2 + gap * 1.5 + 18} width={240} height={12}
          fill={st.borderColor} opacity={0.22} scale={scale} />

        {/* CTA buttons */}
        <rect x={(cx - 115) * scale} y={(y + pad + 65 + headingFs * 2 + gap * 3 + 10) * scale}
          width={110 * scale} height={42 * scale}
          fill={st.accentColor} rx={br * scale} opacity={0.9} />
        <text x={(cx - 60) * scale} y={(y + pad + 65 + headingFs * 2 + gap * 3 + 36) * scale}
          fill="#fff" fontSize={13 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="500">Get Started</text>

        <rect x={(cx + 10) * scale} y={(y + pad + 65 + headingFs * 2 + gap * 3 + 10) * scale}
          width={105 * scale} height={42 * scale}
          fill="none" stroke={st.borderColor} strokeWidth={1.5} rx={br * scale} />
        <text x={(cx + 62) * scale} y={(y + pad + 65 + headingFs * 2 + gap * 3 + 36) * scale}
          fill={st.textColor} fontSize={13 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="400">Learn More</text>

        {/* Hero image area */}
        {height > 350 && (
          <g>
            <rect x={(x + pad + 10) * scale} y={(y + height - pad - 90) * scale}
              width={(width - pad * 2 - 20) * scale} height={70 * scale}
              fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
              rx={br * scale} opacity={0.5} />
            <text x={cx * scale} y={(y + height - pad - 50) * scale}
              fill={st.textColor} fontSize={11 * scale} textAnchor="middle"
              fontFamily="'DM Mono', monospace" opacity={0.4}>[ Hero Image / Video ]</text>
          </g>
        )}
      </g>
    );
  } else if (type === 'features' || type === 'cards') {
    const cols = Math.min(4, Math.max(2, Math.floor(width / 260)));
    const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
    els.push(
      <g key="c">
        <TextLine x={cx - 110} y={y + pad} width={220} height={18}
          fill={st.borderColor} opacity={0.6} scale={scale} rx={4} />
        <TextLine x={cx - 80} y={y + pad + 26} width={160} height={12}
          fill={st.borderColor} opacity={0.28} scale={scale} />

        {Array.from({ length: cols }).map((_, i) => {
          const cX = x + pad + i * (cardW + gap);
          const cY = y + pad + 52;
          const cH = height - pad * 2 - 60;
          return (
            <g key={i}>
              <rect x={cX * scale} y={cY * scale}
                width={cardW * scale} height={cH * scale}
                fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
                rx={br * scale} opacity={0.7} />
              <circle cx={(cX + cardW / 2) * scale} cy={(cY + pad + 16) * scale}
                r={20 * scale} fill={st.bg} stroke={st.accentColor} strokeWidth={1.2} />
              <text x={(cX + cardW / 2) * scale} y={(cY + pad + 22) * scale}
                fill={st.accentColor} fontSize={14 * scale} textAnchor="middle">◆</text>
              <TextLine x={cX + gap} y={cY + pad + 48} width={cardW - gap * 2} height={14}
                fill={st.borderColor} opacity={0.5} scale={scale} rx={3} />
              <TextLine x={cX + gap} y={cY + pad + 72} width={cardW - gap * 2} height={9}
                fill={st.borderColor} opacity={0.22} scale={scale} />
              <TextLine x={cX + gap} y={cY + pad + 88} width={cardW - gap * 3} height={9}
                fill={st.borderColor} opacity={0.16} scale={scale} />
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'form') {
    const formW = Math.min(380, width - pad * 2);
    const formX = cx - formW / 2;
    els.push(
      <g key="c">
        <TextLine x={cx - 90} y={y + pad} width={180} height={18}
          fill={st.borderColor} opacity={0.55} scale={scale} rx={4} />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <TextLine x={formX} y={y + pad + 40 + i * (36 + gap + 12)}
              width={70} height={10} fill={st.textColor} opacity={0.35} scale={scale} />
            <rect x={formX * scale} y={(y + pad + 56 + i * (36 + gap + 12)) * scale}
              width={formW * scale} height={36 * scale}
              fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
              rx={(br * 0.8) * scale} opacity={0.7} />
          </g>
        ))}
        <rect x={(cx - 65) * scale} y={(y + height - pad - 42) * scale}
          width={130 * scale} height={40 * scale}
          fill={st.accentColor} rx={br * scale} opacity={0.85} />
        <text x={cx * scale} y={(y + height - pad - 16) * scale}
          fill="#fff" fontSize={13 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="500">Submit</text>
      </g>
    );
  } else if (type === 'footer') {
    const cols = 4;
    const colW = (width - pad * 2) / cols;
    els.push(
      <g key="c">
        <line x1={(x + pad) * scale} y1={(y + 2) * scale}
          x2={(x + width - pad) * scale} y2={(y + 2) * scale}
          stroke={st.borderColor} strokeWidth={0.5} opacity={0.4} />

        {/* Logo */}
        <rect x={(x + pad) * scale} y={(y + pad) * scale}
          width={80 * scale} height={22 * scale}
          fill={iconBg} stroke={st.borderColor} strokeWidth={0.6} rx={5 * scale} />
        <text x={(x + pad + 40) * scale} y={(y + pad + 15) * scale}
          fill={st.accentColor} fontSize={9.5 * scale} textAnchor="middle"
          fontFamily="'DM Mono', monospace" fontWeight="500">LOGO</text>
        {[0, 1, 2].map(i => (
          <TextLine key={`d${i}`} x={x + pad} y={y + pad + 30 + i * (gap + 2)}
            width={100} height={9} fill={st.borderColor} opacity={0.2} scale={scale} />
        ))}

        {[1, 2, 3].map(col => (
          <g key={col}>
            <TextLine x={x + pad + col * colW} y={y + pad - 2}
              width={60} height={11} fill={st.borderColor} opacity={0.45} scale={scale} rx={2} />
            {[0, 1, 2, 3].map(row => (
              <TextLine key={row} x={x + pad + col * colW} y={y + pad + 18 + row * (gap + 4)}
                width={80} height={9} fill={st.borderColor} opacity={0.18} scale={scale} />
            ))}
          </g>
        ))}

        <line x1={(x + pad) * scale} y1={(y + height - pad - 14) * scale}
          x2={(x + width - pad) * scale} y2={(y + height - pad - 14) * scale}
          stroke={st.borderColor} strokeWidth={0.4} opacity={0.25} />
        <TextLine x={x + pad} y={y + height - pad - 4} width={160} height={8}
          fill={st.borderColor} opacity={0.15} scale={scale} />
      </g>
    );
  } else if (type === 'cta') {
    els.push(
      <g key="c">
        <TextLine x={cx - 180} y={cy - 36} width={360} height={22}
          fill={st.borderColor} opacity={0.65} scale={scale} rx={4} />
        <TextLine x={cx - 130} y={cy - 4} width={260} height={12}
          fill={st.borderColor} opacity={0.3} scale={scale} />
        <rect x={(cx - 75) * scale} y={(cy + 18) * scale}
          width={150 * scale} height={40 * scale}
          fill={st.accentColor} rx={br * scale} opacity={0.85} />
        <text x={cx * scale} y={(cy + 43) * scale}
          fill="#fff" fontSize={13 * scale} textAnchor="middle"
          fontFamily={ff} fontWeight="500">Get Started →</text>
      </g>
    );
  } else if (type === 'testimonials') {
    const count = Math.min(3, Math.max(1, Math.floor(width / 330)));
    const cardW = (width - pad * 2 - gap * (count - 1)) / count;
    els.push(
      <g key="c">
        <TextLine x={cx - 90} y={y + pad} width={180} height={16}
          fill={st.borderColor} opacity={0.5} scale={scale} rx={4} />
        {Array.from({ length: count }).map((_, i) => {
          const tx = x + pad + i * (cardW + gap);
          const tY = y + pad + 30;
          const tH = height - pad * 2 - 40;
          return (
            <g key={i}>
              <rect x={tx * scale} y={tY * scale}
                width={cardW * scale} height={tH * scale}
                fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
                rx={br * scale} opacity={0.5} />
              <text x={(tx + gap) * scale} y={(tY + pad + 6) * scale}
                fill="#f59e0b" fontSize={11 * scale}>★★★★★</text>
              {[0, 1, 2].map(r => (
                <TextLine key={r} x={tx + gap} y={tY + pad + 22 + r * (gap)}
                  width={cardW - gap * 2} height={9} fill={st.borderColor} opacity={0.22} scale={scale} />
              ))}
              <circle cx={(tx + gap + 14) * scale} cy={(tY + tH - pad - 6) * scale}
                r={14 * scale} fill={st.bg} stroke={st.accentColor} strokeWidth={1} />
              <TextLine x={tx + gap + 34} y={tY + tH - pad - 14}
                width={70} height={10} fill={st.borderColor} opacity={0.35} scale={scale} />
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'pricing') {
    const plans = Math.min(3, Math.max(1, Math.floor(width / 330)));
    const cardW = (width - pad * 2 - gap * (plans - 1)) / plans;
    els.push(
      <g key="c">
        <TextLine x={cx - 90} y={y + pad} width={180} height={16}
          fill={st.borderColor} opacity={0.5} scale={scale} rx={4} />
        {Array.from({ length: plans }).map((_, i) => {
          const px = x + pad + i * (cardW + gap);
          const pY = y + pad + 30;
          const pH = height - pad * 2 - 40;
          const hi = i === Math.floor(plans / 2);
          return (
            <g key={i}>
              <rect x={px * scale} y={pY * scale}
                width={cardW * scale} height={pH * scale}
                fill={hi ? iconBg : st.bg}
                stroke={hi ? st.accentColor : st.borderColor}
                strokeWidth={hi ? 1.8 : 0.8}
                rx={(br + 2) * scale} opacity={hi ? 0.85 : 0.5} />
              <TextLine x={px + gap} y={pY + gap} width={60} height={12}
                fill={st.borderColor} opacity={0.45} scale={scale} />
              <TextLine x={px + gap} y={pY + gap * 2 + 8} width={80} height={24}
                fill={st.accentColor} opacity={0.45} scale={scale} rx={4} />
              {[0, 1, 2, 3].map(f => (
                <TextLine key={f} x={px + gap} y={pY + gap * 3 + 44 + f * (gap + 6)}
                  width={cardW - gap * 2} height={10} fill={st.borderColor} opacity={0.22} scale={scale} />
              ))}
              <rect x={(px + gap) * scale} y={(pY + pH - pad - 36) * scale}
                width={(cardW - gap * 2) * scale} height={36 * scale}
                fill={hi ? st.accentColor : st.borderColor} rx={(br * 0.8) * scale} opacity={0.65} />
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'stats') {
    const count = Math.min(4, Math.max(2, Math.floor(width / 250)));
    const statW = (width - pad * 2 - gap * (count - 1)) / count;
    els.push(
      <g key="c">
        {Array.from({ length: count }).map((_, i) => {
          const sx = x + pad + i * (statW + gap);
          return (
            <g key={i}>
              <rect x={sx * scale} y={(y + pad) * scale}
                width={statW * scale} height={(height - pad * 2) * scale}
                fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
                rx={br * scale} opacity={0.5} />
              <TextLine x={sx + gap} y={y + pad + gap} width={60} height={22}
                fill={st.accentColor} opacity={0.45} scale={scale} rx={4} />
              <TextLine x={sx + gap} y={y + pad + gap * 2 + 18} width={80} height={10}
                fill={st.borderColor} opacity={0.28} scale={scale} />
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'accordion') {
    const items = Math.max(2, Math.floor((height - pad * 2 - 30) / (42 + gap)));
    els.push(
      <g key="c">
        <TextLine x={cx - 90} y={y + pad} width={180} height={16}
          fill={st.borderColor} opacity={0.5} scale={scale} rx={4} />
        {Array.from({ length: items }).map((_, i) => {
          const aY = y + pad + 28 + i * (42 + gap);
          return (
            <g key={i}>
              <rect x={(x + pad) * scale} y={aY * scale}
                width={(width - pad * 2) * scale} height={42 * scale}
                fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
                rx={(br * 0.8) * scale} opacity={i === 0 ? 0.7 : 0.3} />
              <TextLine x={x + pad + gap} y={aY + 14} width={width / 3} height={11}
                fill={st.textColor} opacity={0.45} scale={scale} />
              <text x={(x + width - pad - gap) * scale} y={(aY + 26) * scale}
                fill={st.textColor} fontSize={13 * scale} textAnchor="end"
                fontFamily="'DM Mono', monospace" opacity={0.5}>{i === 0 ? '▲' : '▼'}</text>
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'table') {
    const tRows = Math.max(2, Math.floor((height - pad * 2 - 40) / 36));
    const tCols = Math.min(5, Math.floor(width / 170));
    const tColW = (width - pad * 2) / tCols;
    els.push(
      <g key="c">
        <rect x={(x + pad) * scale} y={(y + pad) * scale}
          width={(width - pad * 2) * scale} height={32 * scale}
          fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
          rx={5 * scale} opacity={0.55} />
        {Array.from({ length: tCols }).map((_, c) => (
          <TextLine key={`h${c}`} x={x + pad + 8 + c * tColW} y={y + pad + 10}
            width={tColW - 16} height={10} fill={st.accentColor} opacity={0.3} scale={scale} />
        ))}
        {Array.from({ length: tRows }).map((_, r) => (
          <g key={r}>
            <line x1={(x + pad) * scale} y1={(y + pad + 32 + r * 36) * scale}
              x2={(x + width - pad) * scale} y2={(y + pad + 32 + r * 36) * scale}
              stroke={st.borderColor} strokeWidth={0.4} opacity={0.25} />
            {Array.from({ length: tCols }).map((_, c) => (
              <TextLine key={`${r}-${c}`} x={x + pad + 8 + c * tColW} y={y + pad + 40 + r * 36}
                width={tColW - 20} height={9} fill={st.borderColor} opacity={0.18} scale={scale} />
            ))}
          </g>
        ))}
      </g>
    );
  } else if (type === 'grid') {
    const cols = Math.max(2, Math.floor(width / 200));
    const rows = Math.max(1, Math.floor((height - pad * 2) / 180));
    const cellW = (width - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = (height - pad * 2 - gap * (rows - 1)) / rows;
    els.push(
      <g key="c">
        {Array.from({ length: cols * rows }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <g key={i}>
              <rect
                x={(x + pad + col * (cellW + gap)) * scale}
                y={(y + pad + row * (cellH + gap)) * scale}
                width={cellW * scale} height={cellH * scale}
                fill={iconBg} stroke={st.borderColor} strokeWidth={0.8}
                rx={br * scale} opacity={0.45} />
              <text
                x={(x + pad + col * (cellW + gap) + cellW / 2) * scale}
                y={(y + pad + row * (cellH + gap) + cellH / 2 + 5) * scale}
                fill={st.textColor} fontSize={14 * scale} textAnchor="middle" opacity={0.35}>⊡</text>
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'sidebar') {
    els.push(
      <g key="c">
        <TextLine x={x + pad} y={y + pad} width={width - pad * 2} height={14}
          fill={st.borderColor} opacity={0.4} scale={scale} rx={3} />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <g key={i}>
            <rect x={(x + pad - 2) * scale} y={(y + pad + 24 + i * (34 + gap)) * scale}
              width={(width - pad * 2 + 4) * scale} height={34 * scale}
              fill={iconBg} stroke={st.borderColor} strokeWidth={0.6}
              rx={(br * 0.7) * scale} opacity={i === 0 ? 0.6 : 0.2} />
            <TextLine x={x + pad + 8} y={y + pad + 34 + i * (34 + gap)}
              width={width - pad * 2 - 16} height={10}
              fill={st.borderColor} opacity={0.35} scale={scale} />
          </g>
        ))}
      </g>
    );
  } else if (type === 'tabs') {
    const tabCount = Math.min(5, Math.floor(width / 150));
    const tabW = (width - pad * 2) / tabCount;
    els.push(
      <g key="c">
        {Array.from({ length: tabCount }).map((_, i) => (
          <g key={i}>
            <rect x={(x + pad + i * tabW) * scale} y={(y + pad) * scale}
              width={(tabW - gap / 2) * scale} height={30 * scale}
              fill={i === 0 ? iconBg : 'transparent'}
              stroke={st.borderColor} strokeWidth={0.8}
              rx={5 * scale} opacity={i === 0 ? 0.7 : 0.2} />
            <TextLine x={x + pad + 10 + i * tabW} y={y + pad + 10}
              width={tabW - gap * 2} height={9}
              fill={i === 0 ? st.accentColor : st.borderColor} opacity={0.45} scale={scale} />
          </g>
        ))}
        <rect x={(x + pad) * scale} y={(y + pad + 38) * scale}
          width={(width - pad * 2) * scale} height={(height - pad * 2 - 46) * scale}
          fill={iconBg} stroke={st.borderColor} strokeWidth={0.6}
          rx={br * scale} opacity={0.25} />
        {[0, 1, 2].map(i => (
          <TextLine key={i} x={x + pad + gap} y={y + pad + 56 + i * (gap + 4)}
            width={width * 0.55} height={10} fill={st.borderColor} opacity={0.18} scale={scale} />
        ))}
      </g>
    );
  } else if (type === 'breadcrumb') {
    els.push(
      <g key="c">
        {['Home', '›', 'Category', '›', 'Page'].map((item, i) => (
          <text key={i}
            x={(x + pad + i * 58) * scale}
            y={(y + height / 2 + 4) * scale}
            fill={i === 4 ? st.accentColor : st.textColor}
            fontSize={10 * scale} fontFamily="'DM Mono', monospace"
            opacity={item === '›' ? 0.35 : 0.65}>{item}</text>
        ))}
      </g>
    );
  } else if (type === 'pagination') {
    els.push(
      <g key="c">
        {['‹', '1', '2', '3', '…', '10', '›'].map((item, i) => {
          const pw = 34;
          const startX = cx - (7 * pw) / 2 + i * pw;
          const active = item === '1';
          return (
            <g key={i}>
              <rect x={startX * scale} y={(cy - 16) * scale}
                width={28 * scale} height={32 * scale}
                fill={active ? st.accentColor : iconBg}
                stroke={active ? st.accentColor : st.borderColor}
                strokeWidth={0.8} rx={6 * scale} opacity={active ? 0.85 : 0.35} />
              <text x={(startX + 14) * scale} y={(cy + 4) * scale}
                fill={active ? '#fff' : st.textColor}
                fontSize={10 * scale} textAnchor="middle"
                fontFamily="'DM Mono', monospace">{item}</text>
            </g>
          );
        })}
      </g>
    );
  } else if (type === 'banner') {
    els.push(
      <g key="c">
        <text x={(x + pad) * scale} y={(cy + 4) * scale}
          fill={st.accentColor} fontSize={13 * scale}
          fontFamily="'DM Mono', monospace" fontWeight="600">!</text>
        <TextLine x={x + pad + 24} y={cy - 6} width={width * 0.45} height={12}
          fill={st.borderColor} opacity={0.45} scale={scale} />
        <rect x={(x + width - pad - 80) * scale} y={(cy - 14) * scale}
          width={76 * scale} height={28 * scale}
          fill={st.accentColor} rx={5 * scale} opacity={0.7} />
        <text x={(x + width - pad - 42) * scale} y={(cy + 4) * scale}
          fill="#fff" fontSize={9 * scale} textAnchor="middle"
          fontFamily="'DM Mono', monospace">Action</text>
      </g>
    );
  } else {
    // Generic content
    els.push(
      <g key="c">
        <TextLine x={cx - 130} y={y + pad} width={260} height={18}
          fill={st.borderColor} opacity={0.5} scale={scale} rx={4} />
        {[0, 1, 2, 3].map(i => (
          <TextLine key={i} x={x + pad} y={y + pad + 30 + i * (gap + 4)}
            width={[width * 0.7, width * 0.6, width * 0.5, width * 0.55][i]} height={10}
            fill={st.borderColor} opacity={[0.25, 0.2, 0.16, 0.2][i]} scale={scale} />
        ))}
        {height > 200 && (
          <rect x={(x + pad) * scale} y={(y + pad + 120) * scale}
            width={(width - pad * 2) * scale} height={Math.min(height - 160, 100) * scale}
            fill={iconBg} stroke={st.borderColor} strokeWidth={0.6}
            rx={br * scale} opacity={0.25} />
        )}
      </g>
    );
  }

  /* --- Type badge --- */
  const badgeW = (label.length * 6.2 + 32) * scale;
  els.push(
    <g key="badge">
      <rect x={(x + 10) * scale} y={(y + 8) * scale}
        width={badgeW} height={20 * scale}
        fill={shadeColor(st.bg, 0.06)} stroke={st.borderColor}
        strokeWidth={0.8} rx={5 * scale} />
      <text x={(x + 10) * scale + 10 * scale} y={(y + 8) * scale + 14 * scale}
        fill={st.accentColor} fontSize={9.5 * scale}
        fontFamily="'DM Mono', monospace" fontWeight="500"
        letterSpacing={0.3 * scale}>{label}</text>
    </g>
  );

  /* --- Style info tag (bottom-right) — shows font + colors --- */
  els.push(
    <g key="style-tag" opacity={0.45}>
      <text x={(x + width - pad) * scale} y={(y + height - 8) * scale}
        fill={st.textColor} fontSize={7.5 * scale} textAnchor="end"
        fontFamily="'DM Mono', monospace">
        {st.fontFamily} {st.fontSize}px · p:{st.padding} g:{st.gap} r:{st.borderRadius}
      </text>
    </g>
  );

  return els;
}

/* ================================================================== */
/* Main Canvas component                                               */
/* ================================================================== */

export default function WireframeCanvas({ wireframe, scale = 1 }) {
  if (!wireframe) return null;

  const { width, height, sections } = wireframe;
  const svgWidth = width * scale;
  const svgHeight = height * scale;

  const renderSection = (section, depth = 0) => {
    const elements = renderSectionContent(section, scale);
    const childElements = (section.children || []).map((child) => renderSection(child, depth + 1));
    return <g key={section.id}>{elements}{childElements}</g>;
  };

  return (
    <svg
      width={svgWidth} height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ display: 'block', background: '#0a0a10', borderRadius: 8 }}
    >
      <rect width={svgWidth} height={svgHeight} fill="#0a0a10" rx={8 * scale} />
      {/* Dot grid */}
      {Array.from({ length: Math.ceil(height / 40) }).map((_, r) =>
        Array.from({ length: Math.ceil(width / 40) }).map((_, c) => (
          <circle key={`${r}-${c}`}
            cx={(c * 40 + 20) * scale} cy={(r * 40 + 20) * scale}
            r={0.5 * scale} fill="#1a1a28" />
        ))
      )}
      {sections.map((section) => renderSection(section))}
      <text x={12 * scale} y={(svgHeight - 10) * scale}
        fill="#1a1a28" fontSize={9 * scale}
        fontFamily="'DM Mono', monospace">{width} × {height}px</text>
    </svg>
  );
}
