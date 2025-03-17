declare module '@tiptap/extension-image' {
  import { Node, NodeConfig } from '@tiptap/core';

  export interface ImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, any>;
  }

  export interface ImageAttributes {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
  }

  declare const Image: Node<ImageOptions, any>;
  export default Image;
}
