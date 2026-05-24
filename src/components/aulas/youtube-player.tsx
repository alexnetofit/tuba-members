"use client";

import { getYouTubeId } from "@/lib/utils";

export function YoutubePlayer({ url }: { url: string }) {
  const id = getYouTubeId(url);
  if (!id) {
    return (
      <div className="aspect-video rounded-2xl bg-[--surface-2] flex items-center justify-center text-sm text-[--foreground-muted]">
        URL do YouTube inválida
      </div>
    );
  }
  const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&color=white`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[--border] bg-black shadow-2xl">
      <iframe
        src={src}
        title="Aula"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
