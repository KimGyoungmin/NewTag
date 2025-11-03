import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack: () => void;
  rightButton?: React.ReactNode;
  gradient?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, rightButton, gradient = true }) => {
  const baseClasses = "text-white p-4 flex items-center justify-between";
  const gradientClasses = gradient
    ? "bg-gradient-to-r from-yellow-400 to-orange-500"
    : "bg-yellow-500";

  return (
    <div className={`${baseClasses} ${gradientClasses}`}>
      <div className="flex items-center gap-2 flex-1">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={onBack} />
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      {rightButton && <div className="flex gap-3">{rightButton}</div>}
    </div>
  );
};

export default Header;
