import { getAllVolunteers } from './authService.js';
import { getTaskById } from './taskService.js';

/**
 * Volunteer Matching Engine v2
 * Matches volunteers to tasks based on skills, availability, and distance
 * Now includes workload balancing for fair distribution
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Handle edge cases
  if (lat1 === 0 && lng1 === 0) return 1000; // Unknown location, max distance
  if (lat2 === 0 && lng2 === 0) return 1000;

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate skill match score
 * @param {string[]} volunteerSkills
 * @param {string[]} requiredSkills
 * @returns {number} Score 0-100
 */
const calculateSkillMatch = (volunteerSkills, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!volunteerSkills || volunteerSkills.length === 0) return 0;

  const requiredSet = new Set(requiredSkills.map(s => s.toLowerCase()));
  const volunteerSet = new Set(volunteerSkills.map(s => s.toLowerCase()));

  // Count exact matches
  let matches = 0;
  for (const skill of requiredSet) {
    for (const volSkill of volunteerSet) {
      if (volSkill.includes(skill) || skill.includes(volSkill)) {
        matches++;
        break;
      }
    }
  }

  return (matches / requiredSkills.length) * 100;
};

/**
 * Calculate availability score based on volunteer preferences and task urgency
 * @param {object} volunteerAvailability - volunteer's available time slots
 * @param {number} taskUrgency - urgency level 1-10
 * @returns {number} Score 0-100
 */
const calculateAvailabilityScore = (volunteerAvailability, taskUrgency) => {
  if (!volunteerAvailability || Object.keys(volunteerAvailability).length === 0) {
    // No preference specified - assume available
    return taskUrgency > 7 ? 70 : 60;
  }

  // Check if volunteer has any availability marked
  const hasAvailability = Object.values(volunteerAvailability).some(v => v === true);
  if (!hasAvailability) return 40; // Not available

  // Higher urgency tasks get higher priority
  return taskUrgency > 7 ? 90 : 70;
};

/**
 * Calculate distance score (closer = higher score)
 * @param {number} distance - Distance in km
 * @returns {number} Score 0-100
 */
const calculateDistanceScore = (distance) => {
  if (distance <= 5) return 100;
  if (distance <= 10) return 95;
  if (distance <= 20) return 80;
  if (distance <= 50) return 60;
  if (distance <= 100) return 40;
  if (distance <= 200) return 20;
  return 10;
};

/**
 * Get volunteer's current workload (fair distribution)
 * @param {string} volunteerId
 * @returns {number} Number of active assigned tasks
 */
const getVolunteerWorkload = (volunteerId) => {
  // TODO: Query Firestore for active assigned tasks count
  return 0;
};

/**
 * Calculate workload penalty (prevents over-assignment)
 * @param {number} workload - Current assigned task count
 * @returns {number} Penalty multiplier 0-1
 */
const calculateWorkloadPenalty = (workload) => {
  if (workload === 0) return 1.0;
  if (workload === 1) return 0.9;
  if (workload === 2) return 0.7;
  if (workload === 3) return 0.4;
  return 0.1; // Max workload reached
};

/**
 * Match volunteers to a task
 * Returns sorted list of best matches with workload balancing
 */
export const matchVolunteersToTask = async (taskId) => {
  const task = await getTaskById(taskId);
  const volunteers = await getAllVolunteers();

  const taskLat = task.location?.lat || 0;
  const taskLng = task.location?.lng || 0;
  const requiredSkills = task.requiredSkills || [];

  const scoredVolunteers = volunteers.map(volunteer => {
    const volunteerLat = volunteer.location?.lat || 0;
    const volunteerLng = volunteer.location?.lng || 0;

    // Calculate distance
    const distance = calculateDistance(taskLat, taskLng, volunteerLat, volunteerLng);

    // Calculate individual scores
    const skillScore = calculateSkillMatch(volunteer.skills, requiredSkills);
    const availabilityScore = calculateAvailabilityScore(volunteer.availability, task.urgency);
    const distanceScore = calculateDistanceScore(distance);

    // Get workload for fair distribution
    const workload = getVolunteerWorkload(volunteer.id);
    const workloadPenalty = calculateWorkloadPenalty(workload);

    // Weighted total score with workload balancing
    // Skills: 40%, Availability: 20%, Distance: 20%, Workload: 20%
    const totalScore =
      (skillScore * 0.4) +
      (availabilityScore * 0.2) +
      (distanceScore * 0.2) +
      (workloadPenalty * 100 * 0.2);

    return {
      volunteer,
      distance: Math.round(distance * 100) / 100,
      workload,
      scores: {
        skill: Math.round(skillScore),
        availability: Math.round(availabilityScore),
        distance: Math.round(distanceScore),
        workloadPenalty: Math.round(workloadPenalty * 100),
        total: Math.round(totalScore * 100) / 100,
      },
    };
  });

  // Sort by total score (highest first)
  scoredVolunteers.sort((a, b) => b.scores.total - a.scores.total);

  return scoredVolunteers;
};

/**
 * Get best volunteer for a task (top match)
 */
export const getBestVolunteerForTask = async (taskId) => {
  const matches = await matchVolunteersToTask(taskId);
  return matches.length > 0 ? matches[0] : null;
};

/**
 * Get top N volunteers for a task
 * @param {string} taskId
 * @param {number} limit
 */
export const getTopVolunteerMatches = async (taskId, limit = 5) => {
  const matches = await matchVolunteersToTask(taskId);
  return matches.slice(0, limit);
};
