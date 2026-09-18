import { videoSource } from '@/core/domain/media';

export function LessonVideo({ url, title, poster }: { url: string; title: string; poster: string }) {
  const source = videoSource(url);
  if (!source) return <div className="aspect-video bg-background grid place-content-center p-8 text-center relative overflow-hidden"><span className="text-primary/35 text-6xl font-heading" aria-hidden>△</span><p className="eyebrow mt-6">Mesa em preparação</p><p className="text-xl">O vídeo desta aula ainda não está disponível.</p><p className="text-foreground-muted mt-2">O texto e os materiais permanecem logo abaixo.</p></div>;
  return <div className="aspect-video bg-black">
    {source.kind === 'embed' ? <iframe src={source.url} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <video src={source.url} poster={poster} controls preload="metadata" playsInline className="w-full h-full" aria-label={title} />}
  </div>;
}
