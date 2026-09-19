const ANIMATION_DURATION_MS = 4000;
const FILL_DURATION = '2s';
const FILL_DELAY = '0.5s';

const STYLES = `
  :host {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
  }

  .wrap {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: show ${ANIMATION_DURATION_MS}ms ease forwards;
  }

  @keyframes show {
    0% { opacity: 0; }
    8% { opacity: 1; }
    75% { opacity: 1; }
    100% { opacity: 0; }
  }

  .mascot-wrap {
    position: relative;
    width: clamp(120px, 20vw, 250px);
    aspect-ratio: 1;
    animation: bounceSquash 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
  }

  .mascot-wrap svg {
    width: 100%;
    height: 100%;
    display: block;
  }


  @keyframes bounceSquash {
    0%   { transform: translateY(-80px) scaleY(1.1) scaleX(0.9); opacity: 0; }
    25%  { transform: translateY(10px) scaleY(0.85) scaleX(1.12); opacity: 1; }
    40%  { transform: translateY(-15px) scaleY(1.05) scaleX(0.97); }
    55%  { transform: translateY(5px) scaleY(0.95) scaleX(1.03); }
    70%  { transform: translateY(-3px) scaleY(1.02) scaleX(0.99); }
    100% { transform: translateY(0) scaleY(1) scaleX(1); }
  }

`;

function pandaPaths(ink: string, fur: string, scarf: string, scarfDark: string, extras: boolean): string {
  return `
      <circle cx="33" cy="34" r="18" fill="${ink}"/><circle cx="95" cy="34" r="18" fill="${ink}"/>
      <ellipse cx="64" cy="62" rx="45" ry="41" fill="${fur}"/>
      <path d="M20 92 Q64 120 108 92 L108 108 Q64 134 20 108 Z" fill="${scarf}"/>
      <path d="M20 92 Q64 120 108 92" stroke="${scarfDark}" stroke-width="3" fill="none"/>
      <ellipse cx="46" cy="60" rx="13" ry="15" fill="${ink}" transform="rotate(-15 46 60)"/>
      <ellipse cx="82" cy="60" rx="13" ry="15" fill="${ink}" transform="rotate(15 82 60)"/>
      <path d="M40 59 Q46 64 52 59" stroke="${fur}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M76 59 Q82 64 88 59" stroke="${fur}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="64" cy="76" rx="6" ry="4.2" fill="${ink}"/>
      <path d="M57 84 Q64 89 71 84" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${extras ? '<circle cx="30" cy="76" r="6" fill="#F2B8B5" opacity="0.7"/><circle cx="98" cy="76" r="6" fill="#F2B8B5" opacity="0.7"/>' : ''}`;
}

function buildMascotSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="200" height="200">
    <defs>
      <mask id="riseMask">
        <rect x="0" y="0" width="128" height="128" fill="black"/>
        <rect x="0" y="128" width="128" height="128" fill="white">
          <animate attributeName="y" from="128" to="0" dur="${FILL_DURATION}" begin="${FILL_DELAY}" fill="freeze" calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
        </rect>
      </mask>
    </defs>
    <g opacity="0.3">${pandaPaths('#0F0E2A', '#252360', '#1B2A1F', '#1B2A1F', false)}
    </g>
    <g mask="url(#riseMask)">${pandaPaths('#22232B', '#FBF8F2', '#6E9A5E', '#4F7A45', true)}
    </g>
  </svg>`;
}

export function showStartNotification(): Promise<void> {
  return new Promise((resolve) => {
    const host = document.createElement('ditto-notification');
    host.setAttribute('data-ditto-ignore', '');
    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    shadow.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    const mascotWrap = document.createElement('div');
    mascotWrap.className = 'mascot-wrap';
    mascotWrap.innerHTML = buildMascotSVG();

    wrap.appendChild(mascotWrap);
    shadow.appendChild(wrap);
    document.documentElement.appendChild(host);

    wrap.addEventListener('animationend', (e) => {
      if (e.target !== wrap) return;
      host.remove();
      resolve();
    });
  });
}
