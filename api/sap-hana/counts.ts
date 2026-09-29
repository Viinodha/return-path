import { getLiveHanaTableCounts } from '../_lib/hana';

export default async function handler(_req: any, res: any) {
  try {
    const counts = await getLiveHanaTableCounts(2500);
    return res.status(200).json({ counts });
  } catch (error: any) {
    return res.status(200).json({
      counts: {
        RETURNPATH_PROFILES: 1,
        RETURNPATH_SKILLS: 4,
        RETURNPATH_MILESTONES: 3,
        RETURNPATH_READINESS_LOG: 1,
      },
      error: error.message || 'Failed to fetch table counts',
    });
  }
}
