export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a href="/" className="mt-4 text-sm font-semibold text-primary underline">
        Back to SoroPay
      </a>
    </div>
  );
}
