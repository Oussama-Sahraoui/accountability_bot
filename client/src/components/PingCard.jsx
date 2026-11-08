import React from 'react'

export default function PingCard () {
return(
<main>
    <div className='border border-black  p-3 flex justify-between  gap-2'>
        <div className='border border-black '>

        </div>
        <div className='border border-black  h-full p-2 flex flex-col justify-between gap-6'>
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