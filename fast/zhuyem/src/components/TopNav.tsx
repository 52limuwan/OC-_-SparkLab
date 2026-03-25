import { Search, Bell, Grid, Share2 } from 'lucide-react';

export function TopNav() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-40 flex justify-between items-center px-8 w-full bg-background/80 backdrop-blur-xl font-headline font-medium text-sm text-primary">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search projects, files, or athletes..." 
            className="w-full bg-surface-container-lowest border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-outline-variant/20 placeholder:text-on-surface-variant/50 outline-none"
          />
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-8 mx-8">
        <a href="#" className="text-primary border-b-2 border-primary pb-1">Overview</a>
        <a href="#" className="text-on-surface-variant hover:text-primary transition-all">Analytics</a>
        <a href="#" className="text-on-surface-variant hover:text-primary transition-all">Team</a>
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button className="hover:bg-surface-container-high rounded-full p-2 transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button className="hover:bg-surface-container-high rounded-full p-2 transition-all">
            <Grid className="w-5 h-5" />
          </button>
        </div>
        <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-bold text-xs hover:bg-surface-bright transition-colors flex items-center gap-2">
          <Share2 className="w-3 h-3" />
          Share
        </button>
      </div>
    </header>
  );
}
