import { Request, Response } from 'express';
import { User, Department, Area, Officer } from '../models/index.js';
import bcryptjs from 'bcryptjs';
import { v4 } from 'uuid';
import { sendCredentialsEmail, generatePassword } from '../utils/emailService.js';

class GovernanceController {
  // Create Department
  async createDepartment(req: Request, res: Response) {
    const { name, description, contactPerson, email, phone, governanceType, level } = req.body;

    try {
      // Generate password
      const password = generatePassword('Dept');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create user account
      const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const uid = v4();
      const role = `${governanceType}-level${level}`;

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        uuid: uid,
        phoneNo: phone || '0000000000',
        role,
        previous_complaints: [],
      });

      await newUser.save();

      // Create department
      const newDepartment = new Department({
        name,
        description,
        contactPerson,
        email,
        phone,
        governanceType,
        level,
        userId: newUser._id,
        areas: [],
      });

      await newDepartment.save();

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name: contactPerson,
        password,
        role: `Department Head - ${name}`,
      });

      res.status(201).json({
        message: 'Department created successfully',
        department: newDepartment,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error creating department:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Create Area
  async createArea(req: Request, res: Response) {
    const { name, description, contactPerson, email, phone, departmentId, governanceType, level } = req.body;

    try {
      // Generate password
      const password = generatePassword('Area');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create user account
      const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const uid = v4();
      const role = `${governanceType}-level${level}`;

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        uuid: uid,
        phoneNo: phone || '0000000000',
        role,
        previous_complaints: [],
      });

      await newUser.save();

      // Create area
      const newArea = new Area({
        name,
        description,
        contactPerson,
        email,
        phone,
        departmentId,
        governanceType,
        level,
        userId: newUser._id,
        officers: [],
      });

      await newArea.save();

      // Update department with new area
      if (departmentId) {
        await Department.findByIdAndUpdate(departmentId, {
          $push: { areas: newArea._id },
        });
      }

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name: contactPerson,
        password,
        role: `Area Officer - ${name}`,
      });

      res.status(201).json({
        message: 'Area created successfully',
        area: newArea,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error creating area:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Add Officer
  async addOfficer(req: Request, res: Response) {
    const { name, email, phone, departmentId, areaId, governanceType, level } = req.body;

    try {
      // Generate password
      const password = generatePassword('Off');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create user account
      const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const uid = v4();
      const role = `${governanceType}-level${level}`;

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        uuid: uid,
        phoneNo: phone || '0000000000',
        role,
        previous_complaints: [],
      });

      await newUser.save();

      // Create officer record
      const newOfficer = new Officer({
        name,
        email,
        phone,
        departmentId,
        areaId,
        governanceType,
        level,
        userId: newUser._id,
      });

      await newOfficer.save();

      // Update area with new officer
      if (areaId) {
        await Area.findByIdAndUpdate(areaId, {
          $push: { officers: newUser._id },
        });
      }

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name,
        password,
        role: `Level ${level} Officer`,
      });

      res.status(201).json({
        message: 'Officer added successfully',
        officer: newOfficer,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error adding officer:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Get all departments
  async getDepartments(req: Request, res: Response) {
    const { governanceType, level } = req.query;

    try {
      const filter: any = {};
      if (governanceType) filter.governanceType = governanceType;
      if (level) filter.level = level;

      const departments = await Department.find(filter).populate('userId', '-password');
      res.status(200).json(departments);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get all areas
  async getAreas(req: Request, res: Response) {
    const { governanceType, level, departmentId } = req.query;

    try {
      const filter: any = {};
      if (governanceType) filter.governanceType = governanceType;
      if (level) filter.level = level;
      if (departmentId) filter.departmentId = departmentId;

      const areas = await Area.find(filter).populate('userId', '-password').populate('departmentId');
      res.status(200).json(areas);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get all officers
  async getOfficers(req: Request, res: Response) {
    const { governanceType, level, departmentId, areaId } = req.query;

    try {
      const filter: any = {};
      if (governanceType) filter.governanceType = governanceType;
      if (level) filter.level = level;
      if (departmentId) filter.departmentId = departmentId;
      if (areaId) filter.areaId = areaId;

      const officers = await Officer.find(filter)
        .populate('userId', '-password')
        .populate('departmentId')
        .populate('areaId');
      res.status(200).json(officers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new GovernanceController();
