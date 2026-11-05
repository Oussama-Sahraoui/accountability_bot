import {React,useState} from 'react';
import {Link} from 'react-router-dom';
import PopUpGuide from '../components/PopUpGuide';


export default function LandingPage() {

const [displayGuide,setDisplayGuide]= useState(false)

  return <main className=" text-base flex flex-col justify-between items-center h-90  p-4 ">
    <p>new? click “guide” for a general explanation about this web front end, and how to use it/the bot. When you’re
ready, click user menu or sign in button. Make sure you already used the discord commands /set_password
(as well as /set_time_zone ideally) before you can try to sign in.</p>
    
    <div className=" *:rounded text-lg w-80 lg:h-32 lg:w-120 flex justify-evenly 
   items-center *:border text-6 *:border-black *:px-3 *:py-2 sm:*:p- lg:*:p-4 *:flex *:justify-center 
    *:items-center   *:cursor-pointer                      ">
        <Link to="/sign_in">Sign in</Link>
         <button onClick={()=>setDisplayGuide(true)}>Guide</button> 
    </div>
    
    {displayGuide && <PopUpGuide onClose={() => setDisplayGuide(false)}/>}
    </main>;
}