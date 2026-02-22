const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("../models/User");
const Employee = require("../models/Employee");
const cloudinary = require("../config/cloudinary");

function badRequest(message) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  return err;
}

function unauthorized(message) {
  const err = new Error(message);
  err.code = "UNAUTHORIZED";
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.code = "NOT_FOUND";
  return err;
}

function isValidGender(g) {
  return ["Male", "Female", "Other"].includes(g);
}

module.exports = {
  Query: {
    /**
     * Query Login
     * User can login using username OR email and password
     * Returns: JWT token (string)
     */
    login: async (_, { username, email, password }) => {
      try {
        if ((!username && !email) || !password) {
          throw badRequest("Provide username or email, and password.");
        }

        if (email && !validator.isEmail(email)) {
          throw badRequest("Invalid email format.");
        }

        const user = await User.findOne({
          $or: [
            username ? { username } : null,
            email ? { email: email.toLowerCase() } : null,
          ].filter(Boolean),
        });

        if (!user) throw unauthorized("Invalid credentials.");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw unauthorized("Invalid credentials.");

        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is missing in .env");
        }

        const token = jwt.sign(
          { id: user._id, username: user.username, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        return token;
      } catch (err) {
        // Throwing keeps GraphQL error response
        throw new Error(err.message);
      }
    },

    /**
     * Query Get all employees
     */
    getAllEmployees: async () => {
      try {
        return await Employee.find().sort({ created_at: -1 });
      } catch (err) {
        throw new Error("Failed to fetch employees.");
      }
    },

    /**
     * Query Search employee by eid (employee id)
     * In your typedefs, you might call this getEmployeeById(id: ID!): Employee
     */
    getEmployeeById: async (_, { id }) => {
      try {
        if (!id) throw badRequest("Employee id is required.");

        const emp = await Employee.findById(id);
        if (!emp) throw notFound("Employee not found.");

        return emp;
      } catch (err) {
        throw new Error(err.message);
      }
    },

    /**
     * Query Search Employee by designation or department
     * Returns list
     */
    searchEmployee: async (_, { designation, department }) => {
      try {
        if (!designation && !department) {
          throw badRequest("Provide designation or department to search.");
        }

        const filter = {};
        if (designation) filter.designation = new RegExp(designation, "i");
        if (department) filter.department = new RegExp(department, "i");

        // If both provided, we want OR according to assignment wording
        const query =
          designation && department
            ? { $or: [filter.designation ? { designation: filter.designation } : null,
                      filter.department ? { department: filter.department } : null].filter(Boolean) }
            : filter;

        return await Employee.find(query).sort({ created_at: -1 });
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },

  Mutation: {
    /**
     * Mutation Signup
     * Creates new user
     */
    signup: async (_, { username, email, password }) => {
      try {
        if (!username || !email || !password) {
          throw badRequest("username, email, and password are required.");
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanUsername.length < 3) {
          throw badRequest("username must be at least 3 characters.");
        }

        if (!validator.isEmail(cleanEmail)) {
          throw badRequest("Invalid email format.");
        }

        if (password.length < 6) {
          throw badRequest("password must be at least 6 characters.");
        }

        const existingUser = await User.findOne({
          $or: [{ username: cleanUsername }, { email: cleanEmail }],
        });

        if (existingUser) {
          throw badRequest("User with same username or email already exists.");
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
          username: cleanUsername,
          email: cleanEmail,
          password: hashed,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Return user (never return password)
        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          created_at: user.created_at?.toISOString?.() ?? String(user.created_at),
        };
      } catch (err) {
        throw new Error(err.message);
      }
    },

    /**
     * Mutation Add New employee
     * Upload employee_photo to Cloudinary if provided as base64 data URL
     *
     * IMPORTANT:
     * - Your typeDefs should include employee_photo: String in addEmployee inputs,
     *   OR you can set it after upload and return employee.
     */
    addEmployee: async (
      _,
      {
        first_name,
        last_name,
        email,
        gender,
        designation,
        salary,
        date_of_joining,
        department,
        employee_photo, // base64 data url (optional)
      }
    ) => {
      try {
        // Required validations based on assignment
        if (!first_name || !last_name || !email || !designation || salary == null || !date_of_joining || !department) {
          throw badRequest(
            "first_name, last_name, email, designation, salary, date_of_joining, department are required."
          );
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!validator.isEmail(cleanEmail)) throw badRequest("Invalid employee email format.");

        if (gender && !isValidGender(gender)) {
          throw badRequest("gender must be Male, Female, or Other.");
        }

        const salaryNum = Number(salary);
        if (Number.isNaN(salaryNum)) throw badRequest("salary must be a number.");
        if (salaryNum < 1000) throw badRequest("salary must be >= 1000.");

        const doj = new Date(date_of_joining);
        if (Number.isNaN(doj.getTime())) throw badRequest("date_of_joining must be a valid date string.");

        const emailExists = await Employee.findOne({ email: cleanEmail });
        if (emailExists) throw badRequest("Employee email already exists.");

        // Cloudinary upload (optional)
        let photoUrl = "";
        if (employee_photo) {
          if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
            throw new Error("Cloudinary env variables are missing.");
          }

          const uploadRes = await cloudinary.uploader.upload(employee_photo, {
            folder: "comp3133_employees",
            resource_type: "image",
          });

          photoUrl = uploadRes.secure_url;
        }

        const employee = await Employee.create({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: cleanEmail,
          gender: gender || undefined,
          designation: designation.trim(),
          salary: salaryNum,
          date_of_joining: doj,
          department: department.trim(),
          employee_photo: photoUrl || "",
          created_at: new Date(),
          updated_at: new Date(),
        });

        return employee;
      } catch (err) {
        throw new Error(err.message);
      }
    },

    /**
     * Mutation Update employee by eid
     * Only updates provided fields
     */
    updateEmployee: async (
      _,
      {
        id,
        first_name,
        last_name,
        email,
        gender,
        designation,
        salary,
        date_of_joining,
        department,
        employee_photo, // optional base64 for replacement
      }
    ) => {
      try {
        if (!id) throw badRequest("Employee id is required.");

        const employee = await Employee.findById(id);
        if (!employee) throw notFound("Employee not found.");

        // If email is changing, validate + uniqueness
        if (email !== undefined) {
          const cleanEmail = email.trim().toLowerCase();
          if (!validator.isEmail(cleanEmail)) throw badRequest("Invalid employee email format.");

          const emailExists = await Employee.findOne({ email: cleanEmail, _id: { $ne: id } });
          if (emailExists) throw badRequest("Another employee already uses this email.");

          employee.email = cleanEmail;
        }

        if (first_name !== undefined) employee.first_name = first_name.trim();
        if (last_name !== undefined) employee.last_name = last_name.trim();

        if (gender !== undefined) {
          if (gender && !isValidGender(gender)) throw badRequest("gender must be Male, Female, or Other.");
          employee.gender = gender || undefined;
        }

        if (designation !== undefined) employee.designation = designation.trim();

        if (salary !== undefined) {
          const salaryNum = Number(salary);
          if (Number.isNaN(salaryNum)) throw badRequest("salary must be a number.");
          if (salaryNum < 1000) throw badRequest("salary must be >= 1000.");
          employee.salary = salaryNum;
        }

        if (date_of_joining !== undefined) {
          const doj = new Date(date_of_joining);
          if (Number.isNaN(doj.getTime())) throw badRequest("date_of_joining must be a valid date string.");
          employee.date_of_joining = doj;
        }

        if (department !== undefined) employee.department = department.trim();

        // Optional: update photo to Cloudinary
        if (employee_photo) {
          const uploadRes = await cloudinary.uploader.upload(employee_photo, {
            folder: "comp3133_employees",
            resource_type: "image",
          });
          employee.employee_photo = uploadRes.secure_url;
        }

        employee.updated_at = new Date();

        await employee.save();
        return employee;
      } catch (err) {
        throw new Error(err.message);
      }
    },

    /**
     * Mutation Delete employee by eid
     */
    deleteEmployee: async (_, { id }) => {
      try {
        if (!id) throw badRequest("Employee id is required.");

        const employee = await Employee.findById(id);
        if (!employee) throw notFound("Employee not found.");

        await Employee.findByIdAndDelete(id);
        return "Employee deleted successfully";
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },
};