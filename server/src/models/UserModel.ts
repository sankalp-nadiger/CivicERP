import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    uuid:{
      type:String,
      required:true,
  },
  previous_complaints:[{
      type:String,
      required:true,
  }],
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNo:{
      type:String,
      required:true,
      unique:true
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default:
        'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
    },
    role:{
        type:String,
        default:"User"
    },
    governanceLevel:{
        type:String,
        enum:["LEVEL_1","LEVEL_2","LEVEL_3","LEVEL_4"],
        default:undefined
    },
    governanceType:{
        type:String,
        enum:["CITY","PANCHAYAT"],
        default:undefined
    },
    departmentId:{
        type:String,
        default:undefined
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;