import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { getStaticAssetPath } from '../utils/staticAssets';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fungsi untuk toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Masuk fullscreen
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Keluar fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen untuk perubahan fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 h-14 flex-none z-50 shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 h-full">
          <div className="flex justify-between h-full items-center">
            <div className="flex items-center gap-2">
              <img 
                src={getStaticAssetPath('logo-di.PNG')} 
                alt="Logo DI" 
                className="h-8 w-auto object-contain"
              />
              <img 
                src={getStaticAssetPath('injourneyairports.png')} 
                alt="InJourney Airports" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
                title={isFullscreen ? 'Keluar Fullscreen' : 'Masuk Fullscreen'}
                aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Masuk Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      {/* 
          We keep overflow-hidden here to ensure the fixed sidebar works correctly. 
          The scrolling happens inside the specific content div in App.tsx 
      */}
      <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;