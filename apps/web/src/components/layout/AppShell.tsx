import React from 'react';
import { Header } from './Header';
import { Sidebar, NavPage } from './Sidebar';
import { DemoCase, FallbackState } from '../../types';

interface AppShellProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  currentCase?: DemoCase;
  fallbackState?: FallbackState;
  activeFault?: string | null;
  humanReviewRequired?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPage,
  onSelectPage,
  currentCase,
  fallbackState,
  activeFault,
  humanReviewRequired,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      <Header
        currentCase={currentCase}
        fallbackState={fallbackState}
        activeFault={activeFault}
      />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={onSelectPage}
          humanReviewRequired={humanReviewRequired}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
