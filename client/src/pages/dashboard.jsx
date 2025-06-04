import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaNewspaper, FaUsers } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { LuClipboardEdit } from "react-icons/lu";
import { FaArrowsToDot } from "react-icons/fa6";
import moment from "moment";
import { summary } from "../assets/data";
import clsx from "clsx";
import { Chart } from "../components/Chart";
import { BGS, getInitials, getPriority } from "../utils";
import UserInfo from "../components/UserInfo";

const ComplaintTable = ({ complaints }) => {
  const TableHeader = () => (
    <thead className='border-b border-gray-300'>
      <tr className='text-black text-left'>
        <th className='py-2'>Complaint Title</th>
        <th className='py-2'>Priority</th>
        <th className='py-2'>Category</th>
        <th className='py-2 hidden md:block'>Created At</th>
      </tr>
    </thead>
  );

  const TableRow = ({ complaint }) => (
    <tr className='border-b border-gray-300 text-gray-600 hover:bg-gray-300/10'>
      <td className='py-2'>
        <p className='text-base text-black'>{complaint.title}</p>
      </td>
      <td className='py-2'>
        <span className='capitalize'>{getPriority(complaint.priority_factor)}</span>
      </td>
      <td className='py-2'>
        <div className='flex'>
          {complaint.issue_category.map((m, index) => (
            <div
              key={index}
              className={clsx(
                "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                BGS[index % BGS.length]
              )}
            >
              <UserInfo user={m} />
            </div>
          ))}
        </div>
      </td>
      <td className='py-2 hidden md:block'>
        <span className='text-base text-gray-600'>{moment(complaint.date).fromNow()}</span>
      </td>
    </tr>
  );

  return (
    <div className='w-full md:w-2/3 bg-white px-2 md:px-4 pt-4 pb-4 shadow-md rounded'>
      <table className='w-full'>
        <TableHeader />
        <tbody>
          {complaints?.map((complaint, id) => (
            <TableRow key={id} complaint={complaint} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserTable = ({ users }) => {
  const TableHeader = () => (
    <thead className='border-b border-gray-300'>
      <tr className='text-black text-left'>
        <th className='py-2'>Full Name</th>
        <th className='py-2'>Status</th>
        <th className='py-2'>Created At</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className='border-b border-gray-200 text-gray-600 hover:bg-gray-400/10'>
      <td className='py-2'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-full text-white flex items-center justify-center text-sm bg-violet-700'>
            <span className='text-center'>{getInitials(user?.name)}</span>
          </div>
          <div>
            <p>{user.name}</p>
            <span className='text-xs text-black'>{user?.role}</span>
          </div>
        </div>
      </td>
      <td>
        <p className={clsx("w-fit px-3 py-1 rounded-full text-sm", user?.isActive ? "bg-blue-200" : "bg-yellow-100")}>
          {user?.isActive ? "Active" : "Disabled"}
        </p>
      </td>
      <td className='py-2 text-sm'>{moment(user?.createdAt).fromNow()}</td>
    </tr>
  );

  return (
    <div className='w-full md:w-1/3 bg-white h-fit px-2 md:px-6 py-4 shadow-md rounded'>
      <table className='w-full mb-5'>
        <TableHeader />
        <tbody>
          {users?.map((user, index) => (
            <TableRow key={index + user?._id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      let endpoint = 'http://localhost:5000/complaints/myComplaint';
      let endpoint2 = 'http://localhost:5000/complaints/myComplaint';
    if (user.role === 'User') {
    endpoint = 'http://localhost:5000/admin';
     endpoint2 ='http://localhost:5000/Admin/mystats'
    }
    if (user.role !== 'User' && user.username=="estate_officer") {
      endpoint = 'http://localhost:5000/admin/category2';
       endpoint2 ='http://localhost:5000/Admin/mystats'
      }

    if (user.role === 'User') {
      endpoint = 'http://localhost:5000/complaints/myComplaint';
      endpoint2= 'http://localhost:5000/complaints/mystats'
     }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: user }),
        });
        const data = await response.json();
        setComplaints(data.complaints || []);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    };

    const fetchComplaintStats = async () => {
      let endpoint = 'http://localhost:5000/complaints/myComplaint';
      let endpoint2 = 'http://localhost:5000/complaints/myComplaint';
    if (user.role !== 'User') {
    endpoint = 'http://localhost:5000/admin';
     endpoint2 ='http://localhost:5000/Admin/mystats'
    }

    
    if (user.role !== 'User') {
      endpoint = 'http://localhost:5000/admin/category2';
       endpoint2 ='http://localhost:5000/Admin/mystats'
      }
    if (user.role === 'User') {
      endpoint = 'http://localhost:5000/complaints/myComplaint';
      endpoint2= 'http://localhost:5000/complaints/mystats';}
     
      try {
        const response = await fetch(endpoint2, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: user }),
        });
        const data = await response.json();
        console.log(data);
        setStats([
          { _id: "1", label: "TOTAL COMPLAINTS", count: data.stats.total || 0, icon: <FaNewspaper />, bg: "bg-blue-600" },
          { _id: "2", label: "COMPLETED COMPLAINTS", count: data.stats.completed || 0, icon: <MdAdminPanelSettings />, bg: "bg-green-600" },
          { _id: "3", label: "COMPLAINTS IN PROGRESS", count: data.stats.inProgress || 0, icon: <LuClipboardEdit />, bg: "bg-yellow-600" },
          { _id: "4", label: "TODOS", count: data.stats.todos || 0, icon: <FaArrowsToDot />, bg: "bg-pink-600" },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uuid) {
      fetchComplaints();
      fetchComplaintStats();
    }
  }, [user]);

  const Card = ({ label, count, bg, icon }) => (
    <div className='w-full h-32 bg-white p-5 shadow-md rounded-md flex items-center justify-between' onClick={() => navigate('/tasks')}>
      <div className='flex flex-col justify-between'>
        <p className='text-base text-gray-600'>{label}</p>
        <span className='text-2xl font-semibold'>{count}</span>
        <span className='text-sm text-gray-400'>{"110 last month"}</span>
      </div>
      <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-white", bg)}>{icon}</div>
    </div>
  );

  return (
    <div className='h-full py-4'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>{stats.map((stat, index) => <Card key={index} {...stat} />)}</div>
      {user?.role !== "User" && <div className='w-full bg-white my-16 p-4 rounded shadow-sm'><h4 className='text-xl text-gray-600 font-semibold'>Chart by Priority</h4><Chart /></div>}
      <div className='w-full flex flex-col md:flex-row gap-4 2xl:gap-10 py-8'><ComplaintTable complaints={complaints} />{user?.role !== "User" && <UserTable users={summary.users} />}</div>
    </div>
  );
};

export default Dashboard;
