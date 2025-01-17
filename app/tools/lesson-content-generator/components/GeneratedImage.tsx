"use client";

import React from "react";
import Image from "next/image";

interface GeneratedImageProps {
  imageUrl: string;
}

export function GeneratedImage({ imageUrl }: GeneratedImageProps) {
  return (
    <div className="generated-image mt-4">
      <p className="mb-2 font-semibold">Generated Image</p>
      <Image
        src={imageUrl || "/placeholder.svg"}
        alt="Generated image"
        width={300}
        height={300}
        className="rounded-md"
      />
    </div>
  );
}
