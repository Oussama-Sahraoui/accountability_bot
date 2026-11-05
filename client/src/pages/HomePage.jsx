import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return <div className='border border-black py-2 px-10 '>
        <div className='border border-black py-2 px-4  flex flex-col  justify-evenly h-100'>
            <div className='flex justify-between *:border *:border-black *:rounded *:px-2 *:py-1'>   
                <button>
                    add ping
                </button>
                <button>
                    select server
                </button>
            </div>
            <input placeholder="search for ping by name or ID" className="p-1 border border-black"/>
            <div className=' h-60 border border-black '> 
                {} {/* the ping compotents that are populated */}
            </div>
  
        </div>
  
  </div>
}