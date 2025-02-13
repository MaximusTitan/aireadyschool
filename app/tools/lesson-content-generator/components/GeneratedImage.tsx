"use client";

import React from "react";
import Image from "next/image";

interface GeneratedImageProps {
  imageUrl: string;
}

export function GeneratedImage({ imageUrl }: GeneratedImageProps) {
  return (
    <div className="generated-image relative h-64 w-full">
      <p className="mb-2 font-semibold"></p>
      <div className="relative h-full w-full">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt="Image"
          fill
          className="rounded-md object-contain"
          priority
        />
      </div>
    </div>
  );
}
