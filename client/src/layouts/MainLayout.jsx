import {React, useState} from 'react';

import { Outlet, Link, useLocation} from 'react-router-dom';



export default function MainLayout() {
let text='Sign in'
const location = useLocation();
const currentPath = location.pathname;
currentPath =="/" || currentPath =="/sign_in" ? text='Sign in' : text='User menu'  
  return (
    <main className=" text-xs sm:text-sm lg:text-base">
      <header className="text-sm sm:text-base lg:text-base flex justify-between items-center bg-indigo-950 px-2 sm:px-4 lg:px-6 py-4 sm:py-3 lg:py-4 ">
        <p className='text-lg'>Management Frontend </p> 
        <div className="*:rounded flex justify-between items-center  gap-2  lg:gap-3    *:border *:p-2 lg:*:p-1 ">
          <button>Guide</button>  
          <button>{text}</button>
        </div>
      </header>
          <Outlet/>
      <footer>

        
      </footer>
    </main>
  );
}