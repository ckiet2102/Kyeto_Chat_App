interface VideoMessagePlayerProps {
  src: string;
}

export default function VideoMessagePlayer({ src }: VideoMessagePlayerProps) {
  return (
    <div className="rounded-2xl overflow-hidden max-w-sm border border-border/40 bg-black/90 shadow-md">
      <video
        src={src}
        controls
        preload="metadata"
        className="w-full max-h-72 object-cover rounded-2xl"
      />
    </div>
  );
}
