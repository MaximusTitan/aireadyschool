"use client";

import { Slide } from "../types/presentation";
import { TitleSlide } from "./slides/TitleSlide";
import { ContentWithImageSlide } from "./slides/ContentWithImageSlide";
import { SplitContentSlide } from "./slides/SplitContentSlide";
import { FullBleedSlide } from "./slides/FullBleedSlide";
import { GridLayoutSlide } from "./slides/GridLayoutSlide";
import { QuoteSlide } from "./slides/QuoteSlide";
import { TimelineSlide } from "./slides/TimelineSlide";
import { ComparisonSlide } from "./slides/ComparisonSlide";
import { StatisticSlide } from "./slides/StatisticSlide";
import { BulletPointsSlide } from "./slides/BulletPointsSlide";

interface SlideRendererProps {
  slide: Slide;
  theme: string;
  dimensions: { width: number; height: number };
}

export function SlideRenderer({
  slide,
  theme,
  dimensions,
}: SlideRendererProps) {
  const commonProps = {
    slide,
    theme,
    style: {
      width: "100%",
      height: "100%",
      fontSize: `${dimensions.height * 0.02}px`, // Base font size
      "--title-size": `${dimensions.height * 0.1}px`,
      "--content-size": `${dimensions.height * 0.05}px`,
      "--bullet-size": `${dimensions.height * 0.04}px`,
      "--margin-horizontal": `${dimensions.width * 0.1}px`,
      "--margin-vertical": `${dimensions.height * 0.05}px`,
    } as React.CSSProperties,
  };

  return (
    <div
      className="relative w-full h-full"
      style={{
        aspectRatio: "16/9",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {(() => {
        switch (slide.layout) {
          case "titleSlide":
            return <TitleSlide {...commonProps} />;
          case "contentWithImage":
            return <ContentWithImageSlide {...commonProps} />;
          case "splitContent":
            return <SplitContentSlide {...commonProps} />;
          case "fullBleed":
            return <FullBleedSlide {...commonProps} />;
          case "gridLayout":
            return <GridLayoutSlide {...commonProps} />;
          case "quoteSlide":
            return <QuoteSlide {...commonProps} />;
          case "timelineSlide":
            return <TimelineSlide {...commonProps} />;
          case "comparisonSlide":
            return <ComparisonSlide {...commonProps} />;
          case "statisticSlide":
            return <StatisticSlide {...commonProps} />;
          case "bulletPoints":
            return <BulletPointsSlide {...commonProps} />;
          default:
            return <div>Unsupported layout: {slide.layout}</div>;
        }
      })()}
    </div>
  );
}
