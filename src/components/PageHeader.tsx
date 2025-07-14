
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1 animate-in fade-in slide-in-from-left duration-500">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient leading-none">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="animate-in fade-in slide-in-from-right duration-500">{action}</div>}
    </div>
  );
};

export default PageHeader;
