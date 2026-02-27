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
      const normalizedGovernanceType = (governanceType || '').toString().toLowerCase();
      const normalizedLevel = Number(level);
      const allowedLevels = [1, 2, 3, 4] as const;
      if (!allowedLevels.includes(normalizedLevel as any)) {
        res.status(400).json({ message: 'Invalid governance level' });
        return;
      }
      type GovLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
      const governanceLevel = (`LEVEL_${normalizedLevel}` as GovLevel);

      // Generate password
      const password = generatePassword('Dept');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create or update user account (email is unique)
      const role = 'admin';
      let user = await User.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        user.role = role;
        user.governanceLevel = governanceLevel;
        user.governanceType = normalizedGovernanceType.toUpperCase();
        // Avoid overwriting unique phoneNo unless empty
        if (!user.phoneNo && phone) user.phoneNo = phone;
        await user.save();
      } else {
        const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const uid = v4();
        user = new User({
          username,
          email,
          password: hashedPassword,
          uuid: uid,
          phoneNo: phone || '0000000000',
          role,
          governanceLevel,
          governanceType: normalizedGovernanceType.toUpperCase(),
          previous_complaints: [],
        });
        await user.save();
      }

      // Create or update department
      let department = await Department.findOne({
        email,
        governanceType: normalizedGovernanceType,
        level: normalizedLevel,
      });
      const isNewDepartment = !department;
      if (department) {
        department.name = name;
        department.description = description;
        department.contactPerson = contactPerson;
        department.phone = phone;
        department.userId = user._id;
        await department.save();
      } else {
        department = new Department({
          name,
          description,
          contactPerson,
          email,
          phone,
          governanceType: normalizedGovernanceType,
          level: normalizedLevel,
          userId: user._id,
          areas: [],
        });
        await department.save();
      }

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name: contactPerson,
        password,
        role: `Department Head - ${name}`,
      });

      res.status(isNewDepartment ? 201 : 200).json({
        message: isNewDepartment ? 'Department created successfully' : 'Department updated successfully',
        department,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error creating department:', error);
      const status = error?.code === 11000 ? 409 : 400;
      res.status(status).json({ message: error.message });
    }
  }

  // Create Area
  async createArea(req: Request, res: Response) {
    const { name, description, contactPerson, email, phone, departmentId, governanceType, level, aliases } = req.body;

    try {
      const normalizedGovernanceType = (governanceType || '').toString().toLowerCase();
      const normalizedLevel = Number(level);
      const allowedLevels = [1, 2, 3, 4] as const;
      if (!allowedLevels.includes(normalizedLevel as any)) {
        res.status(400).json({ message: 'Invalid governance level' });
        return;
      }

      // If authentication middleware is enabled, block Level 1 (MCC Head) from creating areas from this endpoint.
      // Note: Governance routes currently have verifyToken commented out; this guard will start applying once enabled.
      const requesterId = (req as any)?.user?.id as string | undefined;
      if (requesterId) {
        const requester = await User.findById(requesterId).select('governanceLevel');
        if (requester?.governanceLevel === 'LEVEL_1') {
          res.status(403).json({ message: 'Level 1 users cannot create areas.' });
          return;
        }
      }

      type GovLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
      const governanceLevel = (`LEVEL_${normalizedLevel}` as GovLevel);

      // Generate password
      const password = generatePassword('Area');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create or update user account (email is unique)
      const role = 'admin';
      let user = await User.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        user.role = role;
        user.governanceLevel = governanceLevel;
        user.governanceType = normalizedGovernanceType.toUpperCase();
        if (!user.phoneNo && phone) user.phoneNo = phone;
        await user.save();
      } else {
        const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const uid = v4();
        user = new User({
          username,
          email,
          password: hashedPassword,
          uuid: uid,
          phoneNo: phone || '0000000000',
          role,
          governanceLevel,
          governanceType: normalizedGovernanceType.toUpperCase(),
          previous_complaints: [],
        });
        await user.save();
      }

      const normalizedAliases: string[] | undefined = Array.isArray(aliases)
        ? aliases.map((a: any) => String(a)).filter(Boolean)
        : typeof aliases === 'string'
        ? aliases
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

      // Create or update area
      const areaQuery: any = {
        email,
        governanceType: normalizedGovernanceType,
        level: normalizedLevel,
      };
      if (departmentId) areaQuery.departmentId = departmentId;
      let area = await Area.findOne(areaQuery);
      const isNewArea = !area;
      if (area) {
        area.name = name;
        area.description = description;
        area.contactPerson = contactPerson;
        area.phone = phone;
        area.departmentId = departmentId;
        area.userId = user._id;
        if (normalizedAliases) (area as any).aliases = normalizedAliases;
        await area.save();
      } else {
        area = new Area({
          name,
          aliases: normalizedAliases,
          description,
          contactPerson,
          email,
          phone,
          departmentId,
          governanceType: normalizedGovernanceType,
          level: normalizedLevel,
          userId: user._id,
          officers: [],
        });
        await area.save();
      }

      // Update department with new area
      if (departmentId && isNewArea) {
        await Department.findByIdAndUpdate(departmentId, {
          $push: { areas: area._id },
        });
      }

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name: contactPerson,
        password,
        role: `Area Officer - ${name}`,
      });

      res.status(isNewArea ? 201 : 200).json({
        message: isNewArea ? 'Area created successfully' : 'Area updated successfully',
        area,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error creating area:', error);
      const status = error?.code === 11000 ? 409 : 400;
      res.status(status).json({ message: error.message });
    }
  }

  // Add Officer
  async addOfficer(req: Request, res: Response) {
    const { name, email, phone, departmentId, departmentName, areaId, areaName, governanceType, level } = req.body;

    try {
      const normalizedGovernanceType = (governanceType || '').toString().toLowerCase();
      const normalizedLevel = Number(level);
      const allowedLevels = [1, 2, 3, 4] as const;
      if (!allowedLevels.includes(normalizedLevel as any)) {
        res.status(400).json({ message: 'Invalid governance level' });
        return;
      }

      // If authentication middleware is enabled, block Level 1 (MCC Head) from creating Level 3 (Zone Officer) accounts.
      // Note: Governance routes currently have verifyToken commented out; this guard will start applying once enabled.
      const requesterId = (req as any)?.user?.id as string | undefined;
      if (requesterId && normalizedLevel === 3) {
        const requester = await User.findById(requesterId).select('governanceLevel');
        if (requester?.governanceLevel === 'LEVEL_1') {
          res.status(403).json({ message: 'Level 1 users cannot add Zone Officers (Level 3).' });
          return;
        }
      }

      type GovLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
      const governanceLevel = (`LEVEL_${normalizedLevel}` as GovLevel);

      // Generate password
      const password = generatePassword('Off');
      const hashedPassword = bcryptjs.hashSync(password, 10);

      // Create or update user account (email is unique)
      const role = 'admin';
      let user = await User.findOne({ email });
      if (user) {
        user.password = hashedPassword;
        user.role = role;
        user.governanceLevel = governanceLevel;
        user.governanceType = normalizedGovernanceType.toUpperCase();
        if (!user.phoneNo && phone) user.phoneNo = phone;
        await user.save();
      } else {
        const username = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const uid = v4();
        user = new User({
          username,
          email,
          password: hashedPassword,
          uuid: uid,
          phoneNo: phone || '0000000000',
          role,
          governanceLevel,
          governanceType: normalizedGovernanceType.toUpperCase(),
          previous_complaints: [],
        });
        await user.save();
      }

      // Create or update officer record (Officer.email is unique)
      let officer = await Officer.findOne({ email });
      const isNewOfficer = !officer;
      if (officer) {
        officer.name = name;
        officer.phone = phone;
        officer.departmentId = departmentId;
        officer.departmentName = departmentName;
        officer.areaId = areaId;
        officer.areaName = areaName;
        officer.governanceType = normalizedGovernanceType;
        officer.level = normalizedLevel;
        officer.userId = user._id;
        await officer.save();
      } else {
        officer = new Officer({
          name,
          email,
          phone,
          departmentId,
          departmentName,
          areaId,
          areaName,
          governanceType: normalizedGovernanceType,
          level: normalizedLevel,
          userId: user._id,
        });
        await officer.save();
      }

      // Update area with new officer
      if (areaId && isNewOfficer) {
        await Area.findByIdAndUpdate(areaId, {
          $push: { officers: user._id },
        });
      }

      // Send credentials email
      const emailSent = await sendCredentialsEmail({
        email,
        name,
        password,
        role: `Level ${level} Officer`,
      });

      res.status(isNewOfficer ? 201 : 200).json({
        message: isNewOfficer ? 'Officer added successfully' : 'Officer updated successfully',
        officer,
        emailSent,
        credentials: { email, password }, // Remove in production
      });
    } catch (error: any) {
      console.error('Error adding officer:', error);
      const status = error?.code === 11000 ? 409 : 400;
      res.status(status).json({ message: error.message });
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
