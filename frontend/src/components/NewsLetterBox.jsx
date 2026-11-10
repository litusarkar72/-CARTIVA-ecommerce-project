import React from 'react'

function NewsLetterBox() {

    const onSubmitHandler = ()=>{
      event.preventDefault();
    }

  return (
    <div className='text-center'>
       <p className='text-2xl font-medium text-gray-800'>
  Subscribe Now & Get 20% Off
</p>

<p className='text-gray-400 mt-3'>
  Join the CARTIVA community and be the first to discover new arrivals,
  exclusive offers, and the latest fashion trends. Subscribe to our
  newsletter today and enjoy 20% off your first purchase. Great style
  and exciting deals are just one click away!
</p>
        <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex item-center gap-3 mx-auto my-6 border pl-3 '>
          <input className='w-full sm:flex-1 outline-none' type="email" placeholder='Enter your email' required/>
          <button type='submit' className='bg-black text-white text-xs px-10 py-4'>SUBSCRIBE</button>
        </form>
      
    </div>
  )
}

export default NewsLetterBox
