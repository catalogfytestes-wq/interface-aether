import { motion } from 'framer-motion';
import { 
  FileText, Video, Music, FolderOpen, 
  Mail, Chrome, Twitter, Youtube,
  Image, Download
} from 'lucide-react';

interface QuickLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'files' | 'apps' | 'social';
}

interface QuickLinksProps {
  onLinkClick?: (id: string) => void;
}

const QuickLinks = ({ onLinkClick }: QuickLinksProps) => {
  const links: QuickLink[] = [
    { id: 'documents', label: 'Documentos', icon: <FileText className="w-3 h-3" />, category: 'files' },
    { id: 'videos', label: 'Vídeos', icon: <Video className="w-3 h-3" />, category: 'files' },
    { id: 'music', label: 'Música', icon: <Music className="w-3 h-3" />, category: 'files' },
    { id: 'programs', label: 'Programas', icon: <FolderOpen className="w-3 h-3" />, category: 'files' },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-3 h-3" />, category: 'files' },
    { id: 'images', label: 'Imagens', icon: <Image className="w-3 h-3" />, category: 'files' },
    { id: 'email', label: 'Email', icon: <Mail className="w-3 h-3" />, category: 'apps' },
    { id: 'browser', label: 'Navegador', icon: <Chrome className="w-3 h-3" />, category: 'apps' },
    { id: 'twitter', label: 'Twitter', icon: <Twitter className="w-3 h-3" />, category: 'social' },
    { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-3 h-3" />, category: 'social' },
  ];

  const categories = [
    { id: 'files', label: 'ARQUIVOS' },
    { id: 'apps', label: 'APPS' },
    { id: 'social', label: 'SOCIAL' },
  ];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="text-[8px] uppercase tracking-widest text-primary/40 font-orbitron mb-2">
            {category.label}
          </div>
          <div className="space-y-1">
            {links
              .filter((link) => link.category === category.id)
              .map((link, i) => (
                <motion.button
                  key={link.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 transition-colors group"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onLinkClick?.(link.id)}
                  whileHover={{ x: 3 }}
                >
                  <span className="text-primary/50 group-hover:text-primary transition-colors">
                    {link.icon}
                  </span>
                  <span className="text-[9px] font-mono text-primary/60 group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                  <motion.div
                    className="ml-auto w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary"
                    whileHover={{ scale: 1.5 }}
                  />
                </motion.button>
              ))}
          </div>
        </div>
      ))}

      {/* Decorative line connections */}
      <div className="relative h-8 mt-4">
        <svg viewBox="0 0 120 32" className="w-full h-full">
          <path
            d="M0 16 L20 16 L30 8 L50 8"
            fill="none"
            stroke="hsl(185 100% 50% / 0.2)"
            strokeWidth="1"
          />
          <path
            d="M0 20 L20 20 L40 28 L60 28"
            fill="none"
            stroke="hsl(185 100% 50% / 0.15)"
            strokeWidth="1"
          />
          <circle cx="50" cy="8" r="2" fill="hsl(185 100% 50% / 0.4)" />
          <circle cx="60" cy="28" r="2" fill="hsl(185 100% 50% / 0.3)" />
        </svg>
      </div>
    </div>
  );
};

export default QuickLinks;
