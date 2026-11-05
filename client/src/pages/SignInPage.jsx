import React from 'react';
import {Link} from 'react-router-dom';

export default function SignInPage() {
  return <div className='flex justify-center p-6'>
    <div className='flex flex-col justify-evenly items-center  bg-gray-300 p-4 lg:p-6 border border-black'>
    <div className='*:p-3 
    *:border *:border-black h-25 lg:h-40 lg:*:w-120 flex flex-col justify-evenly items-center  *:rounded outline-none *:focus:outline-none'>
        <input placeholder='User Discord ID'/>
        <input placeholder='User Password'/>
    
    </div>
    <div className='py-2'>
        <Link to="/home"  className='border border-black cursor-pointer px-2 py-1 rounded '>Sign in</Link>
    </div>
  </div>
  </div>
}