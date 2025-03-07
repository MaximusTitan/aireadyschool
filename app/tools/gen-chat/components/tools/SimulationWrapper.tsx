import { useEffect, useRef } from "react";

interface SimulationWrapperProps {
  code: string;
}

export const SimulationWrapper = ({ code }: SimulationWrapperProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      style={{ width: "100%", height: "800px", border: "none" }}
    />
  );
};
