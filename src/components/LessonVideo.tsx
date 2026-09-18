import { videoSource } from '@/core/domain/media';

export function LessonVideo({ url, title, poster }: { url: string; title: string; poster: string }) {
  const source = videoSource(url);
  if (!source) return <div className="aspect-video bg-surface grid place-content-center p-8 text-center"><p>O vídeo desta aula ainda não está disponível.</p><p className="text-foreground-muted mt-2">Você pode consultar o texto e os materiais abaixo.</p></div>;
  return <div className="aspect-video bg-black">
    {source.kind === 'embed' ? <iframe src={source.url} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <video src={source.url} poster={poster} controls preload="metadata" playsInline className="w-full h-full" aria-label={title} />}
  </div>;
}
