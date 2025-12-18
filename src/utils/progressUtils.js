// frontend/src/utils/progressUtils.js
import moment from 'moment';

/**
 * Calculate project progress from milestones
 * @param {Array} milestones - Array of milestones with weights and progress
 * @returns {number} Project progress percentage
 */
export const calculateProjectProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;

  const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedProgress = milestones.reduce((sum, m) => {
    return sum + ((m.progress || 0) * (m.weight || 0) / 100);
  }, 0);

  return Math.round(weightedProgress);
};

/**
 * Calculate milestone progress from tasks
 * @param {Array} tasks - Array of milestone tasks
 * @param {number} milestoneWeight - Milestone weight in project
 * @returns {object} Progress details
 */
export const calculateMilestoneProgressDetail = (tasks, milestoneWeight) => {
  if (!tasks || tasks.length === 0) {
    return {
      progress: 0,
      completedTasks: 0,
      totalTasks: 0,
      totalTaskWeight: 0,
      contributionToProject: 0
    };
  }

  let totalProgress = 0;
  let completedTasks = 0;
  const totalTasks = tasks.length;
  const totalTaskWeight = tasks.reduce((sum, t) => sum + (t.taskWeight || 0), 0);

  tasks.forEach(task => {
    if (task.status === 'Completed') {
      completedTasks++;
      
      if (task.assignedTo) {
        task.assignedTo.forEach(assignee => {
          if (assignee.completionStatus === 'approved' && assignee.completionGrade) {
            const effectiveScore = (assignee.completionGrade.score / 5) * task.taskWeight;
            totalProgress += effectiveScore;
          }
        });
      }
    }
  });

  const milestoneProgress = Math.min(100, Math.round(totalProgress));
  const contributionToProject = (milestoneProgress * milestoneWeight) / 100;

  return {
    progress: milestoneProgress,
    completedTasks,
    totalTasks,
    totalTaskWeight,
    contributionToProject: Math.round(contributionToProject)
  };
};

/**
 * Get progress status
 * @param {number} progress - Progress percentage
 * @param {string} dueDate - Due date string
 * @returns {object} Status info
 */
export const getProgressStatus = (progress, dueDate) => {
  const daysRemaining = dueDate ? moment(dueDate).diff(moment(), 'days') : null;
  
  if (progress === 100) {
    return { status: 'completed', color: 'success', label: 'Completed' };
  }
  
  if (daysRemaining !== null && daysRemaining < 0) {
    return { status: 'overdue', color: 'error', label: 'Overdue' };
  }
  
  if (progress >= 75) {
    return { status: 'on-track', color: 'success', label: 'On Track' };
  } else if (progress >= 50) {
    return { status: 'progressing', color: 'processing', label: 'Progressing' };
  } else if (progress >= 25) {
    return { status: 'slow', color: 'warning', label: 'Needs Attention' };
  } else if (progress > 0) {
    return { status: 'started', color: 'warning', label: 'Just Started' };
  } else {
    return { status: 'not-started', color: 'default', label: 'Not Started' };
  }
};

/**
 * Calculate health score based on progress and timeline
 * @param {number} progress - Current progress
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {object} Health score and status
 */
export const calculateHealthScore = (progress, startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const now = moment();
  
  const totalDuration = end.diff(start, 'days');
  const elapsed = now.diff(start, 'days');
  const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
  
  const healthScore = progress - expectedProgress;
  
  let status;
  if (healthScore >= 10) {
    status = { label: 'Ahead of Schedule', color: 'success' };
  } else if (healthScore >= -10) {
    status = { label: 'On Schedule', color: 'processing' };
  } else if (healthScore >= -25) {
    status = { label: 'Slightly Behind', color: 'warning' };
  } else {
    status = { label: 'Significantly Behind', color: 'error' };
  }
  
  return {
    healthScore: Math.round(healthScore),
    expectedProgress: Math.round(expectedProgress),
    status
  };
};