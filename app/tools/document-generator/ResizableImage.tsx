import React, { useState, useRef, useEffect } from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';

interface ResizableImageProps {
  node: {
    attrs: {
      src: string;
      alt?: string;
      title?: string;
      width?: number;
      height?: number;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
}

const ResizableImage: React.FC<ResizableImageProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { attrs } = node;
  const [resizing, setResizing] = useState(false);
  const [initialSize, setInitialSize] = useState({ 
    width: attrs.width || 400, 
    height: attrs.height || 300 
  });
  const [size, setSize] = useState({ 
    width: attrs.width || 400, 
    height: attrs.height || 300 
  });
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset component state when attrs change
  useEffect(() => {
    if (attrs.width && attrs.height) {
      setSize({ width: attrs.width, height: attrs.height });
      setInitialSize({ width: attrs.width, height: attrs.height });
    }
  }, [attrs.width, attrs.height]);

  // Handle mouse down to start resizing
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    setInitialSize({ 
      width: size.width || 400, 
      height: size.height || 300 
    });

    const startX = e.clientX;
    const aspectRatio = initialSize.height && initialSize.width 
      ? initialSize.height / initialSize.width 
      : 0.75;

    // Handle mouse movement during resize
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const deltaX = e.clientX - startX;
      // Maintain aspect ratio when resizing
      const newWidth = Math.max(100, initialSize.width + deltaX); // Min width of 100px
      const newHeight = aspectRatio ? Math.round(newWidth * aspectRatio) : newWidth * 0.75;

      setSize({ width: newWidth, height: newHeight });
    };

    // Handle mouse up to stop resizing
    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Update the node attributes when done resizing
      updateAttributes({ 
        width: size.width || 400, 
        height: size.height || 300 
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper className="image-component">
      <div 
        className={`image-container ${selected ? 'selected' : ''} ${resizing ? 'resizing' : ''}`}
        style={{ display: 'inline-block', position: 'relative' }}
      >
        <img
          ref={imageRef}
          src={attrs.src}
          alt={attrs.alt || ''}
          title={attrs.title}
          style={{
            width: size.width || 'auto',
            height: size.height || 'auto',
            display: 'block',
            cursor: 'default',
          }}
        />
        
        {selected && (
          <>
            {/* Resize handle - bottom right */}
            <div 
              className="resize-handle" 
              onMouseDown={startResizing}
              style={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                width: 16,
                height: 16,
                background: 'white',
                border: '2px solid #68cef8',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 10
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ResizableImage;
