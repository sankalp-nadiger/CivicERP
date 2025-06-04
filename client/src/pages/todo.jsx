import React, { useState , useEffect} from "react";
import { FaList } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { useParams } from "react-router-dom";
import Loading from "../components/Loader";
import Title from "../components/Title";
import Button from "../components/Button";
import { IoMdAdd } from "react-icons/io";
import Tabs from "../components/Tabs";
import TaskTitle from "../components/TaskTitle";
import BoardView from "../components/BoardView";
import { tasks,complaints } from "../assets/data";
import Table from "../components/task/Table";
import AddTask from "../components/task/AddTask";
import { useSelector } from "react-redux";

const TABS = [
  { title: "Board View", icon: <MdGridView /> },
  { title: "List View", icon: <FaList /> },
];

const TASK_TYPE = {
  todo: "bg-blue-600",
  "in progress": "bg-yellow-600",
  completed: "bg-green-600",
};

const Todo = () => {
  

  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const { user } = useSelector((state) => state.auth);
 
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        let endpoint = 'http://localhost:5000/admin/getstatus';
       

        const response = await fetch(endpoint , {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "todo",user }),
        });
        const data = await response.json();
        setComplaints(data.complaints || []);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    };

   
    if (user?.uuid) {
      fetchComplaints();
    }
  }, [user]);
  return loading ? (
    <div className='py-10'>
      <Loading />
    </div>
  ) : (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-4'>
        <Title title={status ? `${status} Complaints` : "Complaints"} />

        {!status && (
          <Button
            onClick={() => setOpen(true)}
            label='Create Complaint'
            icon={<IoMdAdd className='text-lg' />}
            className='flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 2xl:py-2.5'
          />
        )}
      </div>

      <Tabs tabs={TABS} setSelected={setSelected}>
        {!status && (
          <div className='w-full flex justify-between gap-4 md:gap-x-12 py-4'>
            <TaskTitle label='To Do' className={TASK_TYPE.todo} />
            <TaskTitle
              label='In Progress'
              className={TASK_TYPE["in progress"]}
            />
            <TaskTitle label='completed' className={TASK_TYPE.completed} />
          </div>
        )}

        {selected !== 1 ? (
          <BoardView complaints={complaints} />
        ) : (
          <div className='w-full'>
            <Table complaints={complaints} />
          </div>
        )}
      </Tabs>

      <AddTask open={open} setOpen={setOpen} />
    </div>
  );
};

export default Todo;
