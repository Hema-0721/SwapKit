import { Request, Response, NextFunction } from 'express';
import { School } from '../models/School';
import { BadRequestError, NotFoundError } from '../utils/apiError';

export const searchSchools = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, pincode } = req.query;
    const filter: any = {};

    if (pincode && typeof pincode === 'string') {
      filter.pincode = pincode;
    }

    if (q && typeof q === 'string' && q.trim().length > 0) {
      filter.$text = { $search: q };
    }

    const schools = await School.find(filter).limit(20);
    res.status(200).json({
      success: true,
      schools,
    });
  } catch (error) {
    next(error);
  }
};

export const createSchool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, board, city, state, pincode, longitude, latitude } = req.body;

    if (!name || !board || !city || !state || !pincode || longitude === undefined || latitude === undefined) {
      throw new BadRequestError('All fields (name, board, city, state, pincode, longitude, latitude) are required');
    }

    // Generate random 8-char admin PIN
    const adminPin = Math.random().toString(36).substring(2, 10).toUpperCase();

    const school = await School.create({
      name,
      board,
      city,
      state,
      pincode,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      adminPin,
      isPartner: false,
    });

    res.status(201).json({
      success: true,
      school,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchoolChecklist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { grade } = req.query;

    if (!grade) {
      throw new BadRequestError('Grade is required');
    }

    const school = await School.findById(id);
    if (!school) {
      throw new NotFoundError('School not found');
    }

    const gradeNum = Number(grade);

    // Mock checklist logic based on class standard
    const mockChecklists: Record<number, Array<{ id: string; name: string; category: string }>> = {
      1: [
        { id: '1', name: 'Standard 1 English Primer Textbook', category: 'textbook' },
        { id: '2', name: 'First Grade Mathematics Workbook', category: 'textbook' },
        { id: '3', name: 'School Uniform Set (Primary size 24)', category: 'uniform_top' },
      ],
      5: [
        { id: '1', name: 'Class 5 NCERT Science Textbook', category: 'textbook' },
        { id: '2', name: 'Class 5 NCERT Mathematics Textbook', category: 'textbook' },
        { id: '3', name: 'Medium Size School Bag', category: 'bag' },
        { id: '4', name: 'Geometry Box Set', category: 'stationery' },
      ],
      10: [
        { id: '1', name: 'Class 10 CBSE Science Textbook', category: 'textbook' },
        { id: '2', name: 'Class 10 CBSE Mathematics Textbook', category: 'textbook' },
        { id: '3', name: 'Class 10 CBSE Social Science Textbook', category: 'textbook' },
        { id: '4', name: 'Navy Blue Blazer Size 36', category: 'uniform_top' },
      ],
    };

    // Fallback default checklist for other grades
    const checklist = mockChecklists[gradeNum] || [
      { id: '1', name: `Class ${gradeNum} Core Textbook Pack`, category: 'textbook' },
      { id: '2', name: `Class ${gradeNum} Regular Uniform Set`, category: 'uniform_top' },
      { id: '3', name: `Notebook Pack (Single Line, 200 pages)`, category: 'stationery' },
    ];

    res.status(200).json({
      success: true,
      schoolName: school.name,
      grade: gradeNum,
      checklist,
    });
  } catch (error) {
    next(error);
  }
};
