import { Popover, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { BiSolidMessageRounded } from "react-icons/bi";
import { HiBellAlert } from "react-icons/hi2";
import { IoIosNotificationsOutline } from "react-icons/io";
import moment from "moment";
import { useNavigate } from "react-router-dom";


// ICONS based on notiType
const ICONS = {
  alert: (
    <HiBellAlert className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
  ),
  message: (
    <BiSolidMessageRounded className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
  ),
};

// Access Control Logic
const accessControl = {
  vc: ["infrastructure", "maintenance", "others", "hostel", "faculty", "library"],
  prince: ["infrastructure", "maintenance", "others", "hostel", "faculty", "library"],
  user: ["infrastructure", "maintenance", "others", "hostel", "faculty", "library"],
  admin: ["infrastructure"],
};

const NotificationPanel = ({ currentUser }) => {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/complaints"); // Your backend API endpoint
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints for current user's role
  const filteredNotifications = complaints.filter((item) =>
    item.issue_category.some((cat) =>
      accessControl[currentUser.role.toLowerCase()]?.includes(cat)
    )
  );

  const viewHandler = (item) => {
    // Optionally update as "read" here
    // axios.post("/api/notifications/read", { userId: currentUser.uuid, complaintId: item._id });
    navigate(`/complaints/${item._id}`);
  };

  const unreadCount = filteredNotifications.length;

  const callsToAction = [
    { name: "Cancel", href: "#", icon: "" },
    {
      name: "Mark All Read",
      href: "#",
      icon: "",
      onClick: () => {
        // Placeholder for mark all as read
        console.log("Marking all as read...");
      },
    },
  ];

  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center outline-none">
        <div className="w-8 h-8 flex items-center justify-center text-gray-800 relative">
          <IoIosNotificationsOutline className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute text-center top-0 right-1 text-sm text-white font-semibold w-4 h-4 rounded-full bg-red-600">
              {unreadCount}
            </span>
          )}
        </div>
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute -right-16 md:-right-2 z-10 mt-5 flex w-screen max-w-max  px-4">
          {({ close }) =>
            unreadCount > 0 && (
              <div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                <div className="p-4">
                  {filteredNotifications.slice(0, 5).map((item, index) => (
                    <div
                      key={item._id + index}
                      className="group relative flex gap-x-4 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="mt-1 h-8 w-8 flex items-center justify-center rounded-lg bg-gray-200 group-hover:bg-white">
                        {ICONS["alert"]}
                      </div>

                      <div
                        className="cursor-pointer"
                        onClick={() => viewHandler(item)}
                      >
                        <div className="flex items-center gap-3 font-semibold text-gray-900 capitalize">
                          <p>Complaint</p>
                          <span className="text-xs font-normal lowercase">
                            {moment(item.date).fromNow()}
                          </span>
                        </div>
                        <p className="line-clamp-1 mt-1 text-gray-600">
                          {item.complaint}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 divide-x bg-gray-50">
                  {callsToAction.map((item) => (
                    <button
                      key={item.name}
                      onClick={
                        item?.onClick ? () => item.onClick() : () => close()
                      }
                      className="flex items-center justify-center gap-x-2.5 p-3 font-semibold text-blue-600 hover:bg-gray-100 w-full"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default NotificationPanel;
