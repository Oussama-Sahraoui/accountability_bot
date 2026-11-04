import { useState } from 'react'
import Axios from 'axios'
import './App.css'

function App() {
const [msg,setMsg]=useState("this should get replaced")
const [setmsgToBackend,setMsgToBackend]=useState("")

const fetch_test_msg = async ()=>{
console.log("ran the fetch!")
  try {
    const response = await Axios.get("http://localhost:3000/fetch_test_msg", {
      
    });
    console.log("test")
    setMsg(response.data);
  } catch (error) {
    console.error("Error :", error);
  
  }
}

const post_test_msg = async ()=>{
console.log("ran the fetch!")
  try {
    const response = await Axios.post("http://localhost:3000/post_test_msg", {
      test_msg:setmsgToBackend
    });

  } catch (error) {
    console.error("Error :", error);
  
  }
}
const list = [{
    ping_id: "testid",
    ping_name: "testname",
    target_channel: "testchannel",
    ping_partner_id: "testid2",
    message: "we be testng",
    score: 1
  },{
    ping_id: "testid",
    ping_name: "testname",
    target_channel: "testchannel",
    ping_partner_id: "testid2",
    message: "we be testng",
    score: 2
  },{
    ping_id: "testid",
    ping_name: "testname",
    target_channel: "testchannel",
    ping_partner_id: "testid2",
    message: "we be testng",
    score: 3
  },{ping_id: "testid",
    ping_name: "testname",
    target_channel: "testchannel",
    ping_partner_id: "testid2",
    message: "we be testng",
    score: 3
  }

]

  // Destructure props correctly using curly braces { }
  function Ping({ ping_id, ping_name, target_channel, ping_partner_id, message, score }) {
    return (
      <div className="border border-black p-2 sm:p-4 lg:p-6">
        <p>Ping information:</p>
        <div className='p-2'>
            <p>ping name: {ping_name}</p>
            <p>Ping id: {ping_id}</p>
            <p>target_channel: {target_channel}</p>
            <p>ping_partner_id: {ping_partner_id}</p>
            <p>message: {message}</p>
            <p>score: {score}</p>
        </div>
      </div>
    )
  }

const pings= list.map(item => (
            <Ping 
              key={item.ping_id} 
              ping_id={item.ping_id} 
              ping_name={item.ping_name}
              target_channel={item.target_channel}
              ping_partner_id={item.ping_partner_id}
              message={item.message}
              score={item.score}
            />
          ))



  return (
    <main className=" text-xs sm:text-sm lg:text-base">
      <header className="text-sm sm:text-base lg:text-base flex justify-between items-center bg-indigo-950 px-2 sm:px-4 lg:px-6 py-3 sm:py-3 lg:py-4 ">
        <p>Management Frontend </p> 
        <div className="flex justify-between items-center  gap-2 sm:gap-2 lg:gap-3    *:border *:p-0.5 lg:*:p-1 ">
          <button>Guide</button>  
          <button>Sign in</button>
        </div>
      </header>
      <div className="border border-black p-2 sm:p-4 lg:p-6" >
        <p className=" py-1 sm:py-2 lg:py-3 "> Your pings </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 border border-black p-2 sm:p-4 lg:p-6" >  
          {pings}
        </div>
      </div>
      <footer></footer>
    </main>
  )
}


export default App
