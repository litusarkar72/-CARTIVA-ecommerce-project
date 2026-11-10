import React from 'react'
import {assets} from '../assets/assets'

function Footer() {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        <div>
            <img src={assets.cartiva} className='mb-5 w-32' alt="" />
           <p className='w-full md:w-2/3 text-gray-600'>
  Welcome to CARTIVA, your one-stop destination for modern fashion
  and lifestyle shopping. Discover a wide range of stylish products,
  explore the latest trends, and enjoy a seamless shopping experience.
  We bring quality, style, and convenience together to make every
  purchase special. Shop smarter, stay trendy, and find everything
  you love at CARTIVA.
</p>
        </div>
        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Home</li>
                <li>About us</li>
                <li>Delivery</li>
                <li>Privacy Policy</li>
            </ul>
        </div>
        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>+1-212-456-7890</li>
                <li>contact@cartiva.com</li>

            </ul>
        </div>
      </div>
     <div>
        <hr />
        <p className='py-5 text-sm text-center'> Copyright 2026@ cartiva.com - All Right Reserved</p>
        </div> 
    </div>
  )
}

export default Footer
