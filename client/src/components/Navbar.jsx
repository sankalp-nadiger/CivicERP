import React from "react";
import { MdOutlineSearch } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setOpenSidebar } from "../redux/slices/authSlice";
import UserAvatar from "./UserAvatar";
import NotificationPanel from "./NotificationPanel";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <div className='flex justify-between items-center bg-white px-4 py-3 2xl:py-4 sticky z-10 top-0'>
      {/* Left Side: Hamburger Menu and Organization Name */}
      <div className='flex gap-4 items-center'>
        <button
          onClick={() => dispatch(setOpenSidebar(true))}
          className='text-2xl text-gray-500 block md:hidden'
        >
          ☰
        </button>

        {/* JSSSTU Organization Text */}
        <span className='hidden md:block text-xl font-bold text-purple-800'>
          JSSSTU Organization
        </span>
      </div>

      {/* Right Side: Search Bar and User Controls */}
      <div className='flex gap-4 items-center'>
        {/* Search Bar */}
        <div className='w-64 2xl:w-[400px] flex items-center py-2 px-3 gap-2 rounded-full bg-[#f3f4f6]'>
          <MdOutlineSearch className='text-gray-500 text-xl' />
          <input
            type='text'
            placeholder='Search....'
            className='flex-1 outline-none bg-transparent placeholder:text-gray-500 text-gray-800'
          />
        </div>

        {/* Notification Panel and User Avatar */}
        <div className='flex gap-2 items-center'>
        <NotificationPanel currentUser={{ uuid: "USER_UUID", role: "vc" }} />
          <UserAvatar />
        </div>
      </div>
    </div>
  );
};

export default Navbar;