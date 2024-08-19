const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const multer = require("multer");
const userSignUp = require("./model/userSignUpModel");
const educatorSignUp = require("./model/educatorSignUpModel");
const courseDetails = require("./model/courseDetailsModel");
const Enroll = require("./model/EnrollModel");
// middleware
const app = express();
app.use(cors({
  origin: 'https://mindsparkpro.vercel.app',
  optionsSuccessStatus: 200
}));
app.use(bodyParser.json());
app.use(
  "/files",
  express.static(path.join(__dirname, "files"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
      }
    },
  })
);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => console.log("Connected to mongoDB"));

const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

//---------------------------- student -----------------------------------------------

app.post("/signup", async (req, res) => {
  try {
    const {
      userSignUpFullName,
      userSignUpEmail,
      userSignUpPassword,
      userSignUpConfirmPassword,
    } = req.body;

    if (!emailPattern.test(userSignUpEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const existingUser = await userSignUp.findOne({ userSignUpEmail });
    if (existingUser) {
      console.log(existingUser);
      return res.status(400).json({ message: "User already exists" });
    }
    if (
      userSignUpPassword &&
      userSignUpConfirmPassword &&
      userSignUpPassword === userSignUpConfirmPassword
    ) {
      const hashedPassword = await bcrypt.hash(userSignUpPassword, 10);
      const hashedConfirmPassword = await bcrypt.hash(
        userSignUpConfirmPassword,
        10
      );

      const newUser = new userSignUp({
        userSignUpFullName,
        userSignUpEmail,
        userSignUpPassword: hashedPassword,
        userSignUpConfirmPassword: hashedConfirmPassword,
      });

      await newUser.save();
      res.status(201).json({ message: "SignUp successful!" });
    } else {
      console.log("Password does not match");
      return res.status(400).json({ message: "Password does not match" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { userLoginEmail, userLoginPassword } = req.body;
  try {
    const user = await userSignUp.findOne({ userSignUpEmail: userLoginEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const passwordValid = await bcrypt.compare(
      userLoginPassword,
      user.userSignUpPassword
    );
    if (!passwordValid) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign({ studentId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: "server error" });
  }
});

// Middleware to check for token for authentication
const verifyTokenStudent = (req, res, next) => {
  console.log("Request headers:", req.headers);
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.log("No Authorization header present");
    return res.status(404).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token);
  console.log("Running verifyToken middleware");

  if (!token) {
    return res.status(404).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.status(401).json({ message: "Failed to authenticate token" });
    }
    req.studentId = decoded.studentId;
    next();
  });
};

// get data of students
app.get("/students", verifyTokenStudent, async (req, res) => {
  try {
    console.log("User ID from token:", req.studentId);
    const student = await userSignUp.findById(req.studentId);
    console.log("User found:", student);

    if (!student) {
      console.log("user not found");
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ student });
  } catch (err) {
    console.log("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get data of particular course

app.get("/particular/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // findById directly takes the ID as an argument
    const newCourse = await courseDetails.findById(id);
    if (!newCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// posting enroll data

app.post("/enroll", async (req, res) => {
  const { EnrollId, ParCourId, EnrollUserFullName, EnrollUserEmail } = req.body;
  try {
    const newEnroll = new Enroll({
      EnrollId,
      ParCourId,
      EnrollUserFullName,
      EnrollUserEmail,
    });
    await newEnroll.save();
    res.status(200).json({ message: "Enrolled Successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// get enrolled data

app.get("/get-enroll", verifyTokenStudent, async (req, res) => {
  try {
    console.log("enroll success");
    const enroll = await Enroll.find({});
    res.status(200).json({ enroll });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "server error" });
  }
});

//---------------------------- educator -----------------------------------------------

app.post("/educator-signup", async (req, res) => {
  try {
    const {
      educatorSignUpFullName,
      educatorSignUpEmail,
      educatorSignUpMobileNo,
      educatorSignUpPassword,
      educatorSignUpConfirmPassword,
    } = req.body;

    if (!emailPattern.test(educatorSignUpEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const existingUser = await educatorSignUp.findOne({ educatorSignUpEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (
      educatorSignUpPassword &&
      educatorSignUpConfirmPassword &&
      educatorSignUpPassword === educatorSignUpConfirmPassword
    ) {
      const hashedPassword = await bcrypt.hash(educatorSignUpPassword, 10);
      const hashedConfirmPassword = await bcrypt.hash(
        educatorSignUpConfirmPassword,
        10
      );
      const newEducator = new educatorSignUp({
        educatorSignUpFullName,
        educatorSignUpEmail,
        educatorSignUpMobileNo,
        educatorSignUpPassword: hashedPassword,
        educatorSignUpConfirmPassword: hashedConfirmPassword,
      });

      await newEducator.save();
      res.status(200).json({ message: "Signup successful!" });
    } else {
      console.log("Password does not match");
      return res.status(400).json({ message: "Password does not match" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

// educator login
app.post("/educator-login", async (req, res) => {
  const { educatorLoginEmail, educatorLoginPassword } = req.body;

  try {
    const educator = await educatorSignUp.findOne({
      educatorSignUpEmail: educatorLoginEmail,
    });

    if (!educator) {
      console.log("email not found");
      return res.status(400).json({ message: "Invalid email" });
    }
    const passwordValid = await bcrypt.compare(
      educatorLoginPassword,
      educator.educatorSignUpPassword
    );
    console.log(passwordValid);

    if (!passwordValid) {
      console.log("password not match");
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign(
      { educatorId: educator._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
});

// Middleware to check for token for authentication
const verifyTokenEducator = (req, res, next) => {
  console.log("Request headers:", req.headers);
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.log("No Authorization header present");
    return res.status(404).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token);
  console.log("Running verifyToken middleware");

  if (!token) {
    console.log("token not found");
    return res.status(404).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.status(401).json({ message: "Failed to authenticate token" });
    }
    req.educatorId = decoded.educatorId;
    next();
  });
};

// get data for managing purpose
app.get("/educatorData", verifyTokenEducator, async (req, res) => {
  try {
    console.log("User ID from token:", req.educatorId);
    const educator = await educatorSignUp.findById(req.educatorId);
    console.log("User found:", educator);

    if (!educator) {
      console.log("user not found");
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ educator });
  } catch (err) {
    console.log("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Getting upload course details

app.get("/details", verifyTokenEducator, async (req, res) => {
  try {
    const videos = await courseDetails.find({});
    console.log(videos);

    if (!videos) {
      console.log("no file found");
      return res.status(404).json({ message: "No file exists" });
    }
    res.status(200).json(videos);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// using multer to upload data
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Upload course Details
app.post(
  "/course-details",
  upload.fields([
    { name: "courseVideo", maxCount: 1 }, // Single video
    { name: "courseImage", maxCount: 1 }, // Single image
  ]),
  async (req, res) => {
    try {
      const {
        courseId,
        educatorName,
        courseTitle,
        courseDescription,
        courseCategory,
        timeStamp,
      } = req.body;
      const courseVideo = req.files["courseVideo"]
        ? req.files["courseVideo"][0].filename
        : null;
      const courseImage = req.files["courseImage"]
        ? req.files["courseImage"][0].filename
        : null;
      console.log(courseId);

      if (
        !courseId ||
        !educatorName ||
        !courseTitle ||
        !courseDescription ||
        !courseCategory ||
        !courseVideo ||
        !courseImage
      ) {
        console.log("All fields are required.");

        return res.status(400).json({ message: "All fields are required." });
      }

      const newCourse = new courseDetails({
        courseId,
        educatorName,
        courseTitle,
        courseDescription,
        courseCategory,
        courseVideo,
        courseImage,
        timeStamp,
      });

      await newCourse.save();
      res
        .status(200)
        .json({ message: "Course details uploaded successfully." });
    } catch (err) {
      res.status(500).json({ message: "server error" });
      console.log(err);
    }
  }
);

// specific course for educator
app.get("/specific/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // findById directly takes the ID as an argument
    const newCourse = await courseDetails.findById(id);
    if (!newCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// deleting particular course
app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  
  try {
    const deleteCourse = await courseDetails.findById(id);
    if(!deleteCourse){
      return res.status(404).json({message:"Not found"});
    }
    await deleteCourse.deleteOne();
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred while deleting the course",});
  }
});

// port and listening
const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server connected to", port));
