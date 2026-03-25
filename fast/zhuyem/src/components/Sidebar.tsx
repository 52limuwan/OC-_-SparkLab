import { 
  Folder, 
  Users, 
  History, 
  Star, 
  FileText, 
  Trash2, 
  Settings, 
  HelpCircle, 
  Plus 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: Folder, label: 'My Project', active: true },
  { icon: Users, label: 'Shared with me' },
  { icon: History, label: 'Recent' },
  { icon: Star, label: 'Starred' },
  { icon: FileText, label: 'Drafts' },
  { icon: Trash2, label: 'Trash' },
];

export function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 font-headline tracking-tight text-sm z-50">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold tracking-tighter text-primary">Project Space</h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">The Digital Curator</p>
      </div>

      <div className="px-4 mb-6">
        <button className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 duration-150">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={cn(
              "mx-2 px-4 py-2 flex items-center gap-3 transition-colors rounded-lg",
              item.active 
                ? "bg-surface-container-high text-primary" 
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
        <a href="#" className="text-on-surface-variant hover:text-primary mx-2 px-4 py-2 flex items-center gap-3 transition-colors hover:bg-surface-container-high/50 rounded-lg">
          <Settings className="w-4 h-4" />
          Settings
        </a>
        <a href="#" className="text-on-surface-variant hover:text-primary mx-2 px-4 py-2 flex items-center gap-3 transition-colors hover:bg-surface-container-high/50 rounded-lg">
          <HelpCircle className="w-4 h-4" />
          Help
        </a>

        <div className="mx-4 mt-4 flex items-center gap-3 px-2 py-3 rounded-xl bg-surface-container">
          <img 
            src="https://picsum.photos/seed/curator/100/100" 
            alt="Alex Curator" 
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-primary truncate">Alex Curator</p>
            <p className="text-[10px] text-on-surface-variant truncate">Premium Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
