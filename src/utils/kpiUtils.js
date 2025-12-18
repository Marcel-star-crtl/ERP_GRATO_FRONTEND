// frontend/src/utils/kpiUtils.js
import moment from 'moment';

/**
 * Calculate overall KPI achievement
 * @param {Array} kpis - Array of KPIs with weights and achievements
 * @returns {number} Overall achievement percentage
 */
export const calculateOverallKPIAchievement = (kpis) => {
  if (!kpis || kpis.length === 0) return 0;

  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedAchievement = kpis.reduce((sum, kpi) => {
    return sum + ((kpi.achievement || 0) * (kpi.weight || 0) / 100);
  }, 0);

  return Math.round(weightedAchievement);
};

/**
 * Validate KPI weights sum to 100%
 * @param {Array} kpis - Array of KPIs with weights
 * @returns {object} Validation result
 */
export const validateKPIWeights = (kpis) => {
  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  
  return {
    isValid: totalWeight === 100,
    totalWeight,
    difference: totalWeight - 100,
    message: totalWeight === 100 ? 'Valid' : `Total is ${totalWeight}%, must be 100%`
  };
};

/**
 * Get KPI achievement status
 * @param {number} achievement - Achievement percentage
 * @returns {object} Status info
 */
export const getKPIAchievementStatus = (achievement) => {
  if (achievement >= 100) {
    return { status: 'excellent', color: 'green', label: 'Achieved' };
  } else if (achievement >= 75) {
    return { status: 'good', color: 'blue', label: 'On Track' };
  } else if (achievement >= 50) {
    return { status: 'average', color: 'orange', label: 'Needs Attention' };
  } else {
    return { status: 'poor', color: 'red', label: 'At Risk' };
  }
};

/**
 * Calculate KPI progress from linked tasks
 * @param {Array} tasks - Tasks linked to the KPI
 * @param {number} kpiWeight - KPI weight percentage
 * @returns {number} Progress contribution
 */
export const calculateKPIProgressFromTasks = (tasks, kpiWeight) => {
  if (!tasks || tasks.length === 0) return 0;

  let totalContribution = 0;
  tasks.forEach(task => {
    if (task.status === 'Completed' && task.assignedTo) {
      task.assignedTo.forEach(assignee => {
        if (assignee.completionStatus === 'approved' && assignee.completionGrade) {
          const grade = assignee.completionGrade.score;
          const contribution = (grade / 5) * (kpiWeight / 100) * 100;
          totalContribution += contribution;
        }
      });
    }
  });

  return Math.min(100, totalContribution);
};

/**
 * Get current quarter string
 * @returns {string} Quarter string (e.g., Q1-2025)
 */
export const getCurrentQuarter = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}-${year}`;
};

/**
 * Get quarter date range
 * @param {string} quarterStr - Quarter string (e.g., Q1-2025)
 * @returns {object} Start and end dates
 */
export const getQuarterDateRange = (quarterStr) => {
  const [q, year] = quarterStr.split('-');
  const quarterNum = parseInt(q.replace('Q', ''));
  const yearNum = parseInt(year);
  
  const startMonth = (quarterNum - 1) * 3;
  const startDate = new Date(yearNum, startMonth, 1);
  const endDate = new Date(yearNum, startMonth + 3, 0, 23, 59, 59);
  
  return { startDate, endDate };
};

/**
 * Format KPI for display
 * @param {object} kpi - KPI object
 * @returns {object} Formatted KPI
 */
export const formatKPIForDisplay = (kpi) => {
  const achievement = kpi.achievement || 0;
  const status = getKPIAchievementStatus(achievement);
  
  return {
    ...kpi,
    formattedAchievement: `${Math.round(achievement)}%`,
    status: status,
    isAchieved: achievement >= 100,
    progressColor: status.color
  };
};