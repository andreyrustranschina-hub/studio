"use client";

import { FolderOpen, Loader, Video, X } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  onScan: () => void;
  isScanning: boolean;
  onStopScan: () => void;
}

export function Header({ onScan, isScanning, onStopScan }: HeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Video className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Local Video Manager
          </h1>
        </div>
        <div>
          {isScanning ? (
            <Button onClick={onStopScan} variant="destructive">
              <X className="mr-2 h-4 w-4" />
              <span>Остановить сканирование</span>
            </Button>
          ) : (
            <Button onClick={onScan} disabled={isScanning}>
              <FolderOpen />
              <span>Выбрать папку для сканирования</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
