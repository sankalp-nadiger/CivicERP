import clsx from "clsx";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { FaBug, FaTasks, FaThumbsUp, FaUser } from "react-icons/fa";
import { GrInProgress } from "react-icons/gr";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdTaskAlt,
} from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { complaints } from "../assets/data";
import Tabs from "../components/Tabs";
import { PRIOTITYSTYELS, TASK_TYPE, getInitials, getPriority,BGS } from "../utils";
import Loading from "../components/Loader";
import Button from "../components/Button";
import CatInfo from "../components/CatInfo";
import { useSelector } from "react-redux";
const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const bgColor = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

const TABS = [
  { title: "Complaint Detail", icon: <FaTasks /> },
  { title: "Activities/Timeline", icon: <RxActivityLog /> },
];

const TASKTYPEICON = {
  commented: (
    <div className='w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white'>
      <MdOutlineMessage />,
    </div>
  ),
  started: (
    <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className='w-6 h-6 flex items-center justify-center rounded-full bg-gray-500 text-white'>
      <FaUser size={14} />
    </div>
  ),

  completed: (
    <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white'>
      <MdOutlineDoneAll size={24} />
    </div>
  ),
  "in progress": (
    <div className='w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white'>
      <GrInProgress size={16} />
    </div>
  ),
};

const act_types = [
  "Started",
  "completed",
  "In Progress",
  "Commented",
  "Assigned",
];

const ComplaintDetails = () => {
  const { user } = useSelector((state) => state.auth);
  const [complaints, setComplaints] = useState([]);
  const { id } = useParams();
  const [selected, setSelected] = useState(0);
  useEffect(() => {
      const fetchComplaints = async () => {
        console.log(user)
        try {
          const response = await fetch('http://localhost:5000/admin/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user }),
          });
          
          const data = await response.json();
          setComplaints(data.complaints);
          console.log(complaints);

        } catch (error) {
          console.error('Error fetching complaints:', error);
        }
      };
  
     
      if (user?.uuid) {
        fetchComplaints();
      }
    }, [user]);
  const complaint = complaints.find((c) => c._id == id);

  const priority = getPriority(complaint?.priority_factor);
  const isAdmin = true; // Replace with actual role check
  
  return (
    <div className='w-full flex flex-col gap-3 mb-4 overflow-y-hidden'>
      <h1 className='text-2xl text-gray-600 font-bold'>{complaint?.title}</h1>

      <Tabs tabs={TABS} setSelected={setSelected}>
        {selected === 0 ? (
          <>
            <div className='w-full flex flex-col md:flex-row gap-5 2xl:gap-8 bg-white shadow-md p-8 overflow-y-auto'>
              {/* LEFT */}
              <div className='w-full md:w-1/2 space-y-8'>
                <div className='flex items-center gap-5'>
                  <div
                    className={clsx(
                      "flex gap-1 items-center text-base font-semibold px-3 py-1 rounded-full",
                      PRIOTITYSTYELS[priority],
                      bgColor[priority]
                    )}
                  >
                    <span className='text-lg'>{ICONS[priority]}</span>
                    <span className='uppercase'>{priority} Priority</span>
                  </div>

                  <div className={clsx("flex items-center gap-2")}>
                    <div
                      className={clsx(
                        "w-4 h-4 rounded-full",
                        TASK_TYPE[complaint?.status]
                      )}
                    />
                    <span className='text-black uppercase'>{complaint?.status}</span>
                  </div>
                </div>

                <p className='text-gray-500'>
                  Created At: {new Date(complaint?.date).toDateString()}
                </p>

                <div className='flex items-center gap-8 p-4 border-y border-gray-200'>
                <div className='space-x-2'>
                    <span className='font-semibold'>Complaint Proof :</span>
                    <span>{complaint?.complaint_proof ? "Available" : "Not Available"}</span>
                  </div>

                  <span className='text-gray-400'>|</span>
                  <div className='space-x-2'>
                    
                    <div className='flex flex-row-reverse'>
            {complaint?.issue_category?.map((category, index) => (
              <div
                key={index}
                className={clsx(
                  "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
                  BGS[index % BGS?.length]
                )}
              >
               <CatInfo user={category} />
              </div>
            ))}
          </div>
                  </div>
                </div>

                <div className='space-y-4 py-6'>
                  <p className='text-gray-600 font-semibold test-sm'>
                    COMPLAINT DESCRIPTION
                  </p>
                  <p className='text-gray-500'>{complaint?.complaint}</p>
                </div>

                <div className='space-y-4 py-6'>
                  <p className='text-gray-500 font-semibold text-sm'>
                    SUMMARIZED COMPLAINT
                  </p>
                  <p className='text-gray-700'>{complaint?.summarized_complaint}</p>
                </div>
              </div>
              {/* RIGHT */}
              <div className='w-full md:w-1/2 space-y-8'>
                <p className='text-lg font-semibold'>COMPLAINT PROOF</p>

                <div className='w-full'>
                  {complaint?.complaint_proof && (
                    <img
                      src={complaint?.complaint_proof}
                      alt={complaint?.title}
                      className='w-full rounded h-28 md:h-36 2xl:h-52 cursor-pointer transition-all duration-700 hover:scale-125 hover:z-50'
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Activities activity={complaint} id={complaint.complaint_id} isAdmin={isAdmin} />
          </>
        )}
      </Tabs>
    </div>
  );
};
 




const Activities = ({ activity, id, isAdmin }) => {
  const [selectedActivity, setSelectedActivity] = useState("");
  const [comment, setComment] = useState("");
  const [activities, setActivities] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const isLoading = false;


 const updateComplaintStatus = async (complaint_id, status, comment, isAdmin) => {
    try {
        const response = await fetch('http://localhost:5000/admin/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                complaint_id,
                status,
                comments: comment,
                // Include user info if needed
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
  };


  const parseComments = (commentStrings) => {
    return commentStrings.map(commentStr => {
      const [type, by, date, activity] = commentStr.split('|');
      return {
        type,
        by: { name: by },
        date: new Date(date),
        activity
      };
    });
  };

  useEffect(() => {
    const fetchActivities = async () => {
      console.log("hiiii"+id)
      try {
        const response = await fetch(`http://localhost:5000/admin/id`, {
          method: 'POST',  // Change to POST
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            // Include any required data in the body
            id: id  // Sending the ID in the body as well
          })
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
    
        if (data.success) {
          setActivities(data.data.comments);
          console.log(data.data.comments)
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    };
    

      fetchActivities();
 
  }, [id]);
 
  
  const handleAddActivity = async () => {
    if (!selectedActivity) {
      toast.error("Please select an activity type!");
      return;
    }
  
   
    
    try {
      // Call the API
      const result = await updateComplaintStatus(
        id,
        selectedActivity,
        comment || `Marked as ${selectedActivity}`,
        isAdmin
      );

      if (result.data?.comments) {
        setActivities(parseComments(result.data.comments));
      }

      // Clear inputs
      setSelectedActivity("");
      setComment("");
      toast.success("Status updated successfully!");
    } catch (error) {
      toast.error("Failed to update status");
    } 
  };


  const Card = ({ item }) => {
    return (
      <div className='flex space-x-4'>
        <div className='flex flex-col items-center flex-shrink-0'>
          <div className='w-10 h-10 flex items-center justify-center'>
            {TASKTYPEICON[item?.type]}
          </div>
          <div className='w-full flex items-center'>
            <div className='w-0.5 bg-gray-300 h-full'></div>
          </div>
        </div>

        <div className='flex flex-col gap-y-1 mb-8'>
          <p className='font-semibold'>{item?.by?.name}</p>
          <div className='text-gray-500 space-y-2'>
        
            <span className='text-sm'>Status changed to {item?.type} </span>
          </div>
          <div className='text-gray-700'>{item?.activity}</div>
        </div>
      </div>
    );
  };

  return (
    <div className='w-full flex gap-10 2xl:gap-20 min-h-screen px-10 py-8 bg-white shadow rounded-md justify-between overflow-y-auto'>
      <div className='w-full md:w-1/2'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Status Comments</h4>

        <div className='w-full'>
          {activities?.map((el, index) => (
            <Card
              key={index}
              item={el}
              isConnected={index < activities.length - 1}
            />
          ))}
        </div>
      </div>

      <div className='w-full md:w-1/3'>
  <h4 className='text-gray-600 font-semibold text-lg mb-5'>
    {user.role !== 'User' ? 'Add Activity' : 'Activity'}
  </h4>

  <div className='w-full flex flex-wrap gap-5'>
    {user.role !== 'User' ? (
      <>
        {act_types.map((item) => (
          <div key={item} className='flex gap-2 items-center'>
            <input
              type='checkbox'
              className='w-4 h-4'
              checked={selectedActivity === item}
              onChange={() => setSelectedActivity(item)}
            />
            <p>{item}</p>
          </div>
        ))}

        <textarea
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Type your comment...'
          className='bg-white w-full mt-10 border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-500'
        />

        {isLoading ? (
          <Loading />
        ) : (
          <Button
            type='button'
            label='Add Status'
            onClick={handleAddActivity}
            className='bg-blue-600 text-white rounded'
          />
        )}
      </>
    ) : (
      <p className='text-gray-500 italic'>You don’t have permission to add activities.</p>
    )}
  </div>
  </div>

    </div>
  );
};
export default ComplaintDetails;