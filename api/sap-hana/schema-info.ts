import { getLiveHanaTableCounts } from '../_lib/hana';

export default async function handler(_req: any, res: any) {
  try {
    const liveCounts = await getLiveHanaTableCounts();

    const tables = [
      {
        name: 'RETURNPATH_PROFILES',
        type: 'COLUMN TABLE',
        columns: ['ID', 'FULL_NAME', 'EMAIL', 'TARGET_ROLE', 'CAREER_GAP_MONTHS', 'CAREER_GAP_REASON', 'READINESS_SCORE', 'UPDATED_AT'],
        recordCount: liveCounts.RETURNPATH_PROFILES,
        isLiveCount: true,
      },
      {
        name: 'RETURNPATH_SKILLS',
        type: 'COLUMN TABLE',
        columns: ['ID', 'PROFILE_ID', 'NAME', 'CATEGORY', 'LEVEL', 'SOURCE', 'VERIFIED', 'CONFIDENCE', 'LAST_PRACTICED'],
        recordCount: liveCounts.RETURNPATH_SKILLS,
        isLiveCount: true,
      },
      {
        name: 'RETURNPATH_MILESTONES',
        type: 'COLUMN TABLE',
        columns: ['ID', 'PROFILE_ID', 'TITLE', 'CATEGORY', 'DURATION', 'COMPLETED', 'PROGRESS', 'TARGET_DATE'],
        recordCount: liveCounts.RETURNPATH_MILESTONES,
        isLiveCount: true,
      },
      {
        name: 'RETURNPATH_READINESS_LOG',
        type: 'COLUMN TABLE',
        columns: ['ID', 'PROFILE_ID', 'ROLE_NAME', 'TOTAL_SCORE', 'SKILLS_SCORE', 'TOOLS_SCORE', 'LEARNING_SCORE', 'PRACTICE_SCORE', 'VERDICT', 'CREATED_AT'],
        recordCount: liveCounts.RETURNPATH_READINESS_LOG,
        isLiveCount: true,
      },
    ];

    return res.status(200).json({ tables });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve schema info' });
  }
}
