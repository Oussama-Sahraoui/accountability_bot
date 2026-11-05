import React from 'react';
import {Link,useLocation} from 'react-router-dom';


//for now I'll just use a place holder, but this text var is what changes based on which page we're on

const guideTexts = {
"/" : `Create ping:
>Give name
>Target channel_ID
>optional message to receive when pinged 
>optional ping_partner when failed
>duration before auto failure when you mark as success or not, if set to zero minutes, then
it never auto fails unless you do /check [success] or /check [failure]

then select a ping and create a ping time associated with the ping you created:
>set time
>day(s)
>optional message that overwrites parent ping message for this specific ping
>optional partner that overwrites parent ping partner

When a ping time matches the current time and day. It activates. And pings you in the channel set in the ping time, with the partner and message (following overwrite logic).

you have a separate  set of pings for each server you in, you select the current server

the guide button changes it’s pop up based on which page you’re in, if you’re confused be
sure to press it. If not, throw me a DM to my personal discord: darth_weeb`
}



export default function PopUpGuide({ onClose }) {
  
const location = useLocation();
const currentPath = location.pathname;
const text = guideTexts[currentPath] || "General guide: Welcome to the frontend!";

  return <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col lg:w-160 border border-black">
    {text}  
    <button className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  
}