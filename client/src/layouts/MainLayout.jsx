import React from 'react';

import { Outlet, Link } from 'react-router-dom';

export default function MainLayout() {
  return (
    <main className=" text-xs sm:text-sm lg:text-base">
      <header className="text-sm sm:text-base lg:text-base flex justify-between items-center bg-indigo-950 px-2 sm:px-4 lg:px-6 py-3 sm:py-3 lg:py-4 ">
        <p>Management Frontend </p> 
        <div className="flex justify-between items-center  gap-2 sm:gap-2 lg:gap-3    *:border *:p-0.5 lg:*:p-1 ">
          <button>Guide</button>  
          <button>Sign in</button>
        </div>
      </header>
          <Outlet/>
      <footer>

        
      </footer>
    </main>
  );
}