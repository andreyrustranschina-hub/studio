import { Video } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex items-center gap-3 h-16 px-4 md:px-8">
        <Video className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Local Video Manager
        </h1>
      </div>
    </header>
  );
}
