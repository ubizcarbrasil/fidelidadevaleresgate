import React from "react";
import { Play } from "lucide-react";

interface VideoInfo {
  id: string;
  title: string;
  description: string;
  video_url: string;
}

interface Props {
  videos: VideoInfo[];
  fontHeading?: string;
}

export type { VideoInfo };

function extrairEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return null;

  return null;
}

function CardVideo({ video, fontHeading }: { video: VideoInfo; fontHeading?: string }) {
  const embedUrl = extrairEmbedUrl(video.video_url);
  const isDirectVideo = !embedUrl && video.video_url.match(/\.(mp4|webm|ogg)(\?|$)/i);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Video player */}
      <div className="relative w-full aspect-video bg-muted/30">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : isDirectVideo ? (
          <video
            src={video.video_url}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
        ) : (
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full flex items-center justify-center"
          >
            <Play className="h-10 w-10 text-muted-foreground/50" />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-sm font-bold text-foreground"
          style={{ fontFamily: fontHeading }}
        >
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SecaoVideosInfo({ videos, fontHeading }: Props) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="mt-6">
      <h2
        className="text-base font-bold text-foreground mb-3"
        style={{ fontFamily: fontHeading }}
      >
        Vídeos
      </h2>
      <div className="space-y-3">
        {videos.map((video) => (
          <CardVideo key={video.id} video={video} fontHeading={fontHeading} />
        ))}
      </div>
    </div>
  );
}
