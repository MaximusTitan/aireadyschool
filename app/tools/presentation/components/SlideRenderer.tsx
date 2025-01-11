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
import { Skeleton } from "@/components/ui/skeleton";

interface SlideRendererProps {
  slide: Slide;
  theme: string;
  imagesLoading?: boolean;
}

export function SlideRenderer({
  slide,
  theme,
  imagesLoading,
}: SlideRendererProps) {
  if (imagesLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  const commonProps = { slide, theme };

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
}
