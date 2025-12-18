// frontend/src/utils/taskUtils.js

import moment from 'moment';

/**
 * Calculate effective score for task completion
 * @param {number} grade - Grade from 1-5
 * @param {number} taskWeight - Task weight percentage
 * @returns {number} Effective score
 */
export const calculateEffectiveScore = (grade, taskWeight) => {
  return (grade / 5) * taskWeight;
};

/**
 * Calculate KPI contribution from task completion
 * @param {number} grade - Grade from 1-5
 * @param {number} kpiWeight - KPI weight percentage
 * @returns {number} KPI contribution percentage
 */
export const calculateKPIContribution = (grade, kpiWeight) => {
  return (grade / 5) * (kpiWeight / 100) * 100;
};

/**
 * Check if task is overdue
 * @param {string} dueDate - Due date string
 * @param {string} status - Task status
 * @returns {boolean} Is overdue
 */
export const isTaskOverdue = (dueDate, status) => {
  if (status === 'Completed') return false;
  return moment(dueDate).isBefore(moment(), 'day');
};

/**
 * Get days until due
 * @param {string} dueDate - Due date string
 * @returns {number} Days until due (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  return moment(dueDate).diff(moment(), 'days');
};

/**
 * Format task priority for display
 * @param {string} priority - Priority level
 * @returns {object} Display info with icon and color
 */
export const formatTaskPriority = (priority) => {
  const priorities = {
    'LOW': { icon: '🟢', color: 'green', label: 'Low' },
    'MEDIUM': { icon: '🟡', color: 'blue', label: 'Medium' },
    'HIGH': { icon: '🟠', color: 'orange', label: 'High' },
    'CRITICAL': { icon: '🔴', color: 'red', label: 'Critical' }
  };
  return priorities[priority] || { icon: '', color: 'default', label: priority };
};

/**
 * Calculate overall task progress for multiple assignees
 * @param {Array} assignedTo - Array of assignees with completion status
 * @returns {number} Overall progress percentage
 */
export const calculateOverallTaskProgress = (assignedTo) => {
  if (!assignedTo || assignedTo.length === 0) return 0;
  
  const completedCount = assignedTo.filter(a => a.completionStatus === 'approved').length;
  return Math.round((completedCount / assignedTo.length) * 100);
};

/**
 * Get task completion status summary
 * @param {Array} assignedTo - Array of assignees
 * @returns {object} Status summary
 */
export const getTaskCompletionSummary = (assignedTo) => {
  if (!assignedTo || assignedTo.length === 0) {
    return {
      total: 0,
      pending: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };
  }

  return {
    total: assignedTo.length,
    pending: assignedTo.filter(a => a.completionStatus === 'pending').length,
    submitted: assignedTo.filter(a => a.completionStatus === 'submitted').length,
    approved: assignedTo.filter(a => a.completionStatus === 'approved').length,
    rejected: assignedTo.filter(a => a.completionStatus === 'rejected').length
  };
};

/**
 * Validate task weight assignment
 * @param {Array} tasks - Array of tasks
 * @param {number} newTaskWeight - Weight of new task
 * @returns {object} Validation result
 */
export const validateTaskWeight = (tasks, newTaskWeight) => {
  const totalExistingWeight = tasks.reduce((sum, task) => sum + (task.taskWeight || 0), 0);
  const totalWeight = totalExistingWeight + newTaskWeight;
  
  return {
    isValid: totalWeight <= 100,
    totalWeight,
    remainingWeight: 100 - totalWeight,
    message: totalWeight > 100 ? `Exceeds 100% by ${totalWeight - 100}%` : 'Valid'
  };
};

/**
 * Get grade description
 * @param {number} grade - Grade value (1-5)
 * @returns {string} Grade description
 */
export const getGradeDescription = (grade) => {
  const descriptions = {
    5: 'Excellent - Exceptional work, exceeded expectations',
    4: 'Good - Met expectations with good quality',
    3: 'Average - Met basic requirements',
    2: 'Below Average - Needs improvement',
    1: 'Poor - Significantly below expectations'
  };
  return descriptions[grade] || 'Not graded';
};

/**
 * Calculate milestone progress from tasks
 * @param {Array} tasks - Array of milestone tasks
 * @returns {number} Milestone progress percentage
 */
export const calculateMilestoneProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  let totalProgress = 0;
  tasks.forEach(task => {
    if (task.status === 'Completed' && task.assignedTo) {
      task.assignedTo.forEach(assignee => {
        if (assignee.completionStatus === 'approved' && assignee.completionGrade) {
          const effectiveScore = calculateEffectiveScore(
            assignee.completionGrade.score,
            task.taskWeight
          );
          totalProgress += effectiveScore;
        }
      });
    }
  });

  return Math.min(100, Math.round(totalProgress));
};