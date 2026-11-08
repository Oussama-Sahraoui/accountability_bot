import React from 'react'

export default function PingCard ({ping_name,target_channel,pinged_partner_id,message,score}) {
return(
<main className='w-full h-full'>
    <div className='border border-black p-1 lg:p-3 flex justify-between gap-1 lg:gap-2 w-full h-full'>
        <div className='border border-black flex-1  overflow-y-scroll p-1'>
            <p>Ping name: {ping_name}</p>
             <p>Target channel: {target_channel}</p>
             <p>Pinged parnter: {pinged_partner_id}</p>
      <div className='overflow-y-scroll h-32 p-1 border border-black'>        <p>Message: {message}</p>  </div>
             <p>Score: {score}</p>
        </div>
        <div className='border border-black  h-full p-2 flex flex-col justify-between gap-2 lg:gap-6'>
            <div className='*:px-1 *:py-1 *:border *:border-black flex flex-col justify-evenly  gap-2'>
                <button>View ping times</button>
                <button>view more</button>
            </div>
            <button className='border border-black '>add or modify ping times</button>
            <div className='*:px-1 *:py-1  *:border *:border-black flex flex-col justify-evenly  gap-2 '>
                <button>delete</button>
                <button>edit</button>
            </div>
        </div>
    </div>
</main>
)
}