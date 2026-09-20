const STYLE_ID = 'ditto-blur-style';
const BLUR_PX = 10;

export function injectBlurStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .ditto-blur {
      filter: blur(${BLUR_PX}px);
      transition: filter 120ms ease;
    }
    .ditto-blur.ditto-blur-peek {
      filter: none;
    }
    .ditto-manual-blur {
      filter: blur(${BLUR_PX}px);
      transition: filter 120ms ease;
    }
  `;
  document.head.appendChild(style);
}

export function removeBlurStyles() {
  document.getElementById(STYLE_ID)?.remove();
}
