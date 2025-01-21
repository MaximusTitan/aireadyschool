"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import { CardContent } from "@/components/ui/card";

interface GeneratedTextProps {
  text: string;
}

type HeadingProps = React.ComponentPropsWithoutRef<"h1">;
type ParagraphProps = React.ComponentPropsWithoutRef<"p">;
type ListProps = React.ComponentPropsWithoutRef<"ul">;
type ListItemProps = React.ComponentPropsWithoutRef<"li">;

const Heading1: React.FC<HeadingProps> = ({ children, ...props }) => (
  <h1
    className="text-3xl font-semibold leading-none tracking-tight mb-4"
    {...props}
  >
    {children}
  </h1>
);

const Heading2: React.FC<HeadingProps> = ({ children, ...props }) => (
  <h2
    className="text-2xl font-semibold leading-none tracking-tight mb-3"
    {...props}
  >
    {children}
  </h2>
);

const Heading3: React.FC<HeadingProps> = ({ children, ...props }) => (
  <h3
    className="text-xl font-semibold leading-none tracking-tight mb-2"
    {...props}
  >
    {children}
  </h3>
);

const Heading4: React.FC<HeadingProps> = ({ children, ...props }) => (
  <h4
    className="text-lg font-semibold leading-none tracking-tight mb-2"
    {...props}
  >
    {children}
  </h4>
);

const Paragraph: React.FC<ParagraphProps> = ({ children, ...props }) => (
  <p
    className="text-base text-muted-foreground mb-4 leading-relaxed"
    {...props}
  >
    {children}
  </p>
);

const Strong: React.FC<ParagraphProps> = ({ children, ...props }) => (
  <strong className="font-semibold text-primary" {...props}>
    {children}
  </strong>
);

const UnorderedList: React.FC<ListProps> = ({ children, ...props }) => (
  <ul className="list-disc pl-6 mb-4 text-sm text-muted-foreground" {...props}>
    {children}
  </ul>
);

const OrderedList: React.FC<ListProps> = ({ children, ...props }) => (
  <ol
    className="list-decimal pl-6 mb-4 text-sm text-muted-foreground"
    {...props}
  >
    {children}
  </ol>
);

const ListItem: React.FC<ListItemProps> = ({ children, ...props }) => (
  <li className="mb-2" {...props}>
    {children}
  </li>
);

export function GeneratedText({ text }: GeneratedTextProps) {
  return (
    <CardContent className="generated-text mt-4 rounded-md overflow-auto max-h-[70vh] p-4">
      <ReactMarkdown
        components={{
          h1: Heading1,
          h2: Heading2,
          h3: Heading3,
          h4: Heading4,
          p: Paragraph,
          strong: Strong,
          ul: UnorderedList,
          ol: OrderedList,
          li: ListItem,
        }}
      >
        {text.replace(/####([^#\n]+)/g, "### $1")}
      </ReactMarkdown>
    </CardContent>
  );
}
