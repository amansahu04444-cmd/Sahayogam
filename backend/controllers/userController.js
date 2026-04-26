import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';

/**
 * Get current user profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await authService.getUserById(req.user.uid);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(error.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

/**
 * Update current user profile
 * PUT /api/users/update
 */
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, skills, location, availability } = req.body;

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Ensure skills is always an array before saving to DB
    const safeSkills = Array.isArray(skills)
      ? skills
      : skills
        ? [skills]
        : [];

    const updatedUser = await authService.updateUser(req.user.uid, {
      name,
      skills: safeSkills,
      location,
      availability,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(error.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * Get all volunteers
 * GET /api/volunteers
 */
export const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await authService.getAllVolunteers();

    res.json({
      success: true,
      count: volunteers.length,
      data: volunteers,
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get volunteers',
    });
  }
};

/**
 * Get volunteers by skill
 * GET /api/users/volunteers/skill/:skill
 */
export const getVolunteersBySkill = async (req, res) => {
  try {
    const { skill } = req.params;
    const volunteers = await authService.getVolunteersBySkill(skill);

    res.json({
      success: true,
      count: volunteers.length,
      data: volunteers,
    });
  } catch (error) {
    console.error('Get volunteers by skill error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get volunteers',
    });
  }
};
