import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let portalRoot: HTMLDivElement | null = null;
let portalRefs = 0;

function getPortalRoot() {
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'editor-portal-root';
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
}

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    portalRefs++;

    return () => {
      portalRefs--;
      if (portalRefs === 0 && portalRoot) {
        document.body.removeChild(portalRoot);
        portalRoot = null;
      }
    };
  }, []);

  return mounted ? createPortal(children, getPortalRoot()) : null;
}
