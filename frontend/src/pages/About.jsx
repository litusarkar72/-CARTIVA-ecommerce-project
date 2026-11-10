
import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsLetterBox'

const About = () => {
  return (
    <div>
      {/* About Us Heading */}
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      {/* About Us Content */}
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img
          className='w-full md:max-w-112.5 object-cover'
          src={assets.about_img}
          alt="About CARTIVA"
        />

        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>
            Welcome to CARTIVA, your destination for discovering the latest
            fashion trends and lifestyle essentials. We believe shopping
            should be simple, enjoyable, and accessible to everyone.
          </p>

          <p>
            At CARTIVA, we bring together style, quality, and convenience.
            From everyday essentials to trending collections, our goal is
            to help you find products that match your personality and
            lifestyle.
          </p>

          <b className='text-gray-800'>Our Mission</b>

          <p>
            Our mission is to make online shopping a seamless and enjoyable
            experience by offering a carefully selected range of products,
            convenient shopping options, and customer-focused service.
            We aim to bring you a better shopping experience with every visit.
          </p>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className='text-2xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>

        {/* Quality Assurance */}
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b className='text-gray-800'>Quality Assurance</b>
          <p className='text-gray-600'>
            We focus on offering products selected with quality, style,
            and customer satisfaction in mind. Every shopping experience
            should bring you confidence and value.
          </p>
        </div>

        {/* Convenience */}
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b className='text-gray-800'>Convenience</b>
          <p className='text-gray-600'>
            Enjoy a smooth and convenient shopping experience. Browse
            collections, explore products, and place your orders anytime,
            from anywhere.
          </p>
        </div>

        {/* Customer Service */}
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b className='text-gray-800'>Customer Satisfaction</b>
          <p className='text-gray-600'>
            Your satisfaction matters to us. We strive to make every
            interaction simple, helpful, and enjoyable, from discovering
            your favorite products to completing your purchase.
          </p>
        </div>

      </div>

      {/* Newsletter */}
      <NewsletterBox />
    </div>
  )
}

export default About
