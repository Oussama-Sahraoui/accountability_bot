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
    score: 12
  }]

  // Destructure props correctly using curly braces { }
  function Ping({ ping_id, ping_name, target_channel, ping_partner_id, message, score }) {
    return (
      <div>
        <p>test</p>
        <p>Ping id: {ping_id}</p>
        <p>ping name: {ping_name}</p>
        <p>target_channel: {target_channel}</p>
        <p>ping_partner_id: {ping_partner_id}</p>
        <p>message: {message}</p>
        <p>score: {score}</p>
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
    <main>
      <header>
        Management framework  
        <div>
          <button>Guide</button>  
          <button>Sign in</button>
        </div>
      </header>
      <div>
        <p> Your pings </p>
        <div>  
          {pings}
        </div>
      </div>
      <footer></footer>
    </main>
  )
}


export default App
