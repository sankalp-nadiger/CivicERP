import React, { useState, useEffect,useRef } from "react";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Textbox from "../Textbox";
import { useForm } from "react-hook-form";
import SelectList from "../SelectList";
import { BiImages } from "react-icons/bi";
import Button from "../Button";
import { useSelector } from "react-redux";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from '../../firebase';
// Define issue categories for college complaints



//image uploading is here





const ISSUE_CATEGORIES = [
  "Infrastructure",
  "Faculty",
  "Examinations",
  "Hostel",
  "Library",
  "Ragging",
  "women safety",
  "Others",
];

const AddComplaint = ({ open, setOpen }) => {


  const fileRef = useRef(null);
  const [image, setImage] = useState(null);
  const [link,setLink] = useState('www.google.com');

  useEffect(() => {
    if (image) {
      handleFileUpload(image);
    }
   
  }, [image]);

  const handleFileUpload = async (image) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);
    uploadTask.on(
      'state_changed',
      (snapshot) => {},
      (error) => {},
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setLink(downloadURL)
        );
      }
    );
    console.log(link)
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [issueCategory, setIssueCategory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  ;
  const submitHandler = async (data) => {
    const complaintData = {
      uuid: user.uuid, // Replace with actual user UUID
      title: data.title,
      complaint: data.complaint,
      issue_category: issueCategory,
      complaint_proof: link, // Assuming backend handles file uploads separately
    };
    console.log(link)
    try {
      const response = await fetch("http://localhost:5000/complaints/addComplaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaintData),
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log("Complaint submitted successfully", result);
        setOpen(false); // Close modal on success
      } else {
        console.error("Error submitting complaint", result);
      }
    } catch (error) {
      console.error("Network error", error);
    }
  };
  

  const handleSelect = (e) => {
    setAssets(e.target.files);
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(submitHandler)}>
          <Dialog.Title
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            ADD COMPLAINT
          </Dialog.Title>

          <div className='mt-2 flex flex-col gap-6'>
            {/* Title of the Complaint */}
            <Textbox
              placeholder='Title of the Complaint'
              type='text'
              name='title'
              label='Title of the Complaint'
              className='w-full rounded'
              register={register("title", { required: "Title is required" })}
              error={errors.title ? errors.title.message : ""}
            />

            {/* Complaint Description */}
            <Textbox
              placeholder='Describe your complaint'
              type='text'
              name='complaint'
              label='Complaint'
              className='w-full rounded'
              register={register("complaint", {
                required: "Complaint description is required",
              })}
              error={errors.complaint ? errors.complaint.message : ""}
              isTextArea={true}
            />

            {/* Issue Category */}
            <SelectList
              label='Issue Category'
              lists={ISSUE_CATEGORIES}
              selected={issueCategory}
              setSelected={setIssueCategory}
            />

            {/* Upload Proof */}
            <div className='w-full flex items-center justify-center mt-4'>
              <label
                className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4'
                htmlFor='imgUpload'
              >
                <input
                  type='file'
                  className='hidden'
                  id='imgUpload'
                  ref={fileRef}
                   onChange={(e) => setImage(e.target.files[0])}
                  accept='.jpg, .png, .jpeg'
                  multiple={true}
                />
                <BiImages />
                <span>Upload Proof</span>
              </label>
            </div>

            {/* Submit and Cancel Buttons */}
            <div className='bg-gray-50 py-6 sm:flex sm:flex-row-reverse gap-4'>
              {uploading ? (
                <span className='text-sm py-2 text-red-500'>
                  Uploading assets
                </span>
              ) : (
                <Button
                  label='Submit'
                  type='submit'
                  className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto'
                />
              )}

              <Button
                type='button'
                className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
                onClick={() => setOpen(false)}
                label='Cancel'
              />
            </div>
          </div>
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddComplaint;