import {React,useState} from 'react';
import { Link} from 'react-router-dom';
import PingCard from '../components/PingCard';

export default function HomePage() {


//this is place holder dummy data to see how the UI looks before I carry on with further coding
//keep in mind not all the fetched data is display right away, some additional data like specific ips
//are hidden behind the view more button. In addition to that for user convinence we try to display the
//actual content associated with a given ID (for example the actual channel and the actual user)
//not the brute ID on it's own
const data=[

{
ping_name:"teeth",
target_channe:"",
pinged_partner_id:"",
message:"",
score:''
},
{
"":""

},
{
"":""

}
]
  return <div className='   py-2 px-10 '>
        <div className=' border border-black py-2 px-4  flex flex-col  justify-evenly gap-2'>
            <div className='  flex justify-between *:border *:border-black *:rounded *:px-2 *:py-1'>   
                <button>
                    add ping
                </button>
                <button>
                    select server 
                </button>
            </div>
            <input placeholder="  search for ping by name or ID" className="p-1 border border-black"/>
            <div className="   border border-black p-2">
                <div className='    max-w-5xl mx-auto  grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center'>               
                    <PingCard/>
                    <PingCard/>
                    <PingCard/>
                    
                </div>
            </div>
  
        </div>
  
  </div>
}