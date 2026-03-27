import "dotenv/config";
import mongoose from "mongoose";
import User from "./dist/models/UserModel.js";
import Complaint from "./dist/models/ComplaintModel.js";

const uuid = "16b95133-3450-4817-b248-543b634676c9";

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ uuid });
  const total = await Complaint.countDocuments({});

  let byRaised = 0;
  let byDirect = 0;
  let byUuidPrefix = 0;

  if (user) {
    byRaised = await Complaint.countDocuments({ raisedBy: user._id });
    byDirect = await Complaint.countDocuments({ complaint_id: { $in: user.previous_complaints || [] } });
  }

  byUuidPrefix = await Complaint.countDocuments({ complaint_id: { $regex: "^" + uuid } });

  console.log(JSON.stringify({
    userFound: !!user,
    userId: user?._id || null,
    prevCount: user?.previous_complaints?.length || 0,
    totalComplaints: total,
    byRaised,
    byDirect,
    byUuidPrefix
  }, null, 2));
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
