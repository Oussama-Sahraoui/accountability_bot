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


  return (
    <div>
    
    {msg}
<input onChange={(e) => setMsgToBackend(e.target.value)} />   
 <button  onClick={()=>{fetch_test_msg()}   }>Click to get message from backend</button>
   <button  onClick={()=>{post_test_msg()}   }>Click to send message to backend </button>
    </div>
  )
}

export default App
