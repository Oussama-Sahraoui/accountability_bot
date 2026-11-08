import {React,useState} from 'react';
import { Link} from 'react-router-dom';
import PingCard from '../components/PingCard';
import Axios from 'axios'

export default function HomePage() {

    const [selectedServer,setSelectedServer]=useState("")

const fetchServers = async ()=>{
try{
    const  response =  await axios.post("http://localhost:3000/fetch_servers",{
   },{ 
    withCredentials: true 
})
  console.log(response)
}
catch(err){
    console.log(err)
}
}
//this is place holder dummy data to see how the UI looks before I carry on with further coding
//keep in mind not all the fetched data is display right away, some additional data like specific ips
//are hidden behind the view more button. In addition to that for user convinence we try to display the
//actual content associated with a given ID (for example the actual channel and the actual user)
//not the brute ID on it's own
const data=[

{
ping_name:"teeth",
target_channel:"",
pinged_partner_id:"",
message:"this is a relatively normal length message, let's see if it creates issues. It seems like it's not, but let's keep going. Maybe I'll have it so if a message overflows then it just scrolls within it. Which is very unlikely to happen anyways",
score:''
},
{
ping_name:"very long title for testing",
target_channel:"",
pinged_partner_id:"",
message:"",
score:''
},
{
ping_name:"teeth",
target_channel:"",
pinged_partner_id:"",
message:"",
score:''
}
]

const pings = data.map((ping)=>(
<PingCard ping_name={ping.ping_name} target_channel={ping.target_channel} 
pinged_partner_id={ping.pinged_partner_id} message={ping.message} score={ping.score}/>
))
  return <div className='   py-2 px-3 lg:px-10 '>
        <div className=' border border-black  py-2 px-2 lg:px-4  flex flex-col  justify-evenly gap-2'>
            <div className='  flex justify-between *:border *:border-black *:rounded *:px-2 *:py-1'>   
                <button>
                    add ping
                </button>
                <button onClick={()=>{fetchServers()}}>
                    select server 
                </button>
            </div>
            <input placeholder="  search for ping by name or ID" className="p-1 border border-black"/>
            <div className="   p-2">
<div className='max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 w-full'>                   
     {pings}
                    
                    
                </div>
            </div>
  
        </div>
  
  </div>
}