"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo as PhotoData } from "@/lib/photos";

/**
 * A cover photo that fills its parent (the parent sets size and position).
 * If the file is missing, the parent's background colour shows instead, so a
 * section never displays a broken image.
 */
export function Photo({ photo, sizes, priority = false, className = "" }: {
  photo: PhotoData;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={72}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      style={{ objectPosition: photo.focus }}
    />
  );
}
