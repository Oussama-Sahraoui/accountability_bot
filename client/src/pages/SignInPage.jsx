import {React,useState} from 'react';
import {Link} from 'react-router-dom';
import Axios from 'axios'
export default function SignInPage() {
  
  
  const submitLogin=async()=> {
  try{ 
    const response = await Axios.post('http://localhost:3000/sign_in', {
  password: passWord,
  user_id: userId
}, {
  withCredentials: true 
});
  console.log(response)
  }
  catch(err){

  }
  }
    
  



  const [passWord,setPassWord]=useState("")
  const [userId,setUserId]=useState("")
  return <div className='flex justify-center p-6'>
    <div className='flex flex-col justify-evenly items-center  bg-gray-300 p-4 lg:p-6 border border-black'>
    <div className='*:p-3 
    *:border *:border-black h-25 lg:h-40 lg:*:w-120 flex flex-col justify-evenly items-center  *:rounded outline-none *:focus:outline-none'>
        <input onChange={(e)=>setUserId(e.target.value)} placeholder='User Discord ID'/>
        <input onChange={(e)=>setPassWord(e.target.value)} placeholder='User Password'/>
    
    </div>
    <div className='py-2'>
        <button to="/home" onClick={()=>{submitLogin()}} className='border border-black cursor-pointer px-2 py-1 rounded '>Sign in</button>
    </div>
  </div>
  </div>
}