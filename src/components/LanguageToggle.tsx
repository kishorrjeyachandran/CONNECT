import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'english', name: 'English', nativeName: 'English' },
    { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'hindi', name: 'Hindi', nativeName: 'हिंदी' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="glass-card">
          <Globe className="h-4 w-4" />
          <span className="ml-2 capitalize">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glass-card">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{lang.name}</span>
              <span className="text-sm text-muted-foreground">{lang.nativeName}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};