
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallPrompt({
  isOpen,
  onClose,
}: PWAInstallPromptProps) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [autoVisible, setAutoVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [isIOS] = useState(() => {
    if (typeof navigator === 'undefined') return false;

    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  });

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const isDismissed =
      dismissedAt !== null &&
      Date.now() - Number(dismissedAt) < cooldown;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      setInstallEvent(event as BeforeInstallPromptEvent);

      if (!isDismissed) {
        setAutoVisible(true);
      }
    };

    const handleInstalled = () => {
      setAutoVisible(false);
      setInstallEvent(null);
      onClose();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [onClose]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!installEvent) return;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === 'accepted') {
        setAutoVisible(false);
        onClose();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setAutoVisible(false);
    setShowIOSGuide(false);
    onClose();
  };

  const visible = isOpen || autoVisible;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="overflow-hidden rounded-xl bg-emerald-600 p-2 text-white">
            <Image
              src="/icon.svg"
              alt="PetaUang Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-950">
              Pasang PetaUang
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Akses pengelolaan keuangan dengan lebih praktis
              langsung dari perangkatmu.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {showIOSGuide ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p className="mb-2 font-semibold">
              Cara memasang PetaUang:
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Tekan tombol Share pada browser.</li>
              <li>Pilih <strong>Add to Home Screen</strong>.</li>
              <li>Tekan <strong>Add</strong> untuk memasang aplikasi.</li>
            </ol>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            disabled={!isIOS && !installEvent}
            className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
}

