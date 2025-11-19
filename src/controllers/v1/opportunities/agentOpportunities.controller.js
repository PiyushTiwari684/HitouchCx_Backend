import { PrismaClient} from '@prisma/client';
const prisma = new PrismaClient();

/*
  Weights (total ≈ 100)
*/
const WEIGHTS = {
  skills: 35,
  qualifications: 20,
  experience: 30,        // split into years + domain (industry/vertical)
  languageLevel: 10,     // derived from test results or heuristic
  languages: 5
};

const LANGUAGE_LEVEL_MAP = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };

/*
  Try to fetch language test results if future model exists.
  (Placeholder: adapt after you add LanguageProficiencyTest model.)
  Expected shape: { level: 'B2' | 'C1' | ... }
*/
async function fetchLanguageTests(agentId) {
  // If model not yet created this will fail; we catch and return empty.
  try {
    if (!('languageProficiencyTest' in prisma)) return [];
    return await prisma.languageProficiencyTest.findMany({
      where: { agentId }
    });
  } catch {
    return [];
  }
}

/*
  Decide agent language level:
  1. Use highest test level if tests exist.
  2. Else estimate: if has experiences -> C1 else B1.
*/
function resolveAgentLanguageLevel(agent, tests) {
  if (tests && tests.length) {
    const levels = tests
      .map(t => t.level)
      .filter(l => LANGUAGE_LEVEL_MAP[l]);
    if (levels.length) {
      // Pick highest numeric level
      return levels.sort((a, b) => LANGUAGE_LEVEL_MAP[b] - LANGUAGE_LEVEL_MAP[a])[0];
    }
  }
  return agent.experiences.length > 0 ? 'C1' : 'B1';
}

/*
  Safe parse JSON fields.
*/
function safeParse(val) {
  if (!val) return null;
  try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return null; }
}

/*
  Total experience years (approx).
*/
function totalYears(experiences) {
  return experiences.reduce((sum, e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    const diff = Math.max(0, end - start);
    const years = diff / (1000 * 60 * 60 * 24 * 365);
    return sum + years;
  }, 0);
}

/*
  Domain alignment: industry + vertical match bonus.
*/
function domainAlignment(agent, opportunity) {
  const industries = agent.experiences.map(e => e.industry).filter(Boolean);
  const verticals = agent.experiences.map(e => e.vertical).filter(Boolean);

  const hasIndustry = industries.includes(opportunity.project?.department) ||
    industries.includes(opportunity.category); // loose heuristic
  const hasVertical = verticals.includes(opportunity.processType);

  let ratio = 0;
  if (hasIndustry) ratio += 0.5;
  if (hasVertical) ratio += 0.5;
  return ratio; // 0, 0.5, or 1
}

/*
  Score a single opportunity.
*/
function scoreOpportunity(agent, opportunity, agentLanguageLevel) {
  const breakdown = {
    skills: 0,
    qualifications: 0,
    experienceYears: 0,
    experienceDomain: 0,
    experience: 0,
    languageLevel: 0,
    languages: 0,
    total: 0,
    disqualified: false,
    reasons: []
  };

  const requiredSkills = opportunity.minimumSkills || [];
  const agentSkills = agent.skills || [];
  const requiredLanguages = opportunity.requiredLanguages || [];
  const agentLanguages = agent.languages || [];

  // Skills ratio
  const matchedSkills = requiredSkills.filter(s => agentSkills.includes(s)).length;
  const skillRatio = requiredSkills.length === 0 ? 1 : matchedSkills / requiredSkills.length;

  if (skillRatio < 0.5) {
    breakdown.disqualified = true;
    breakdown.reasons.push('Less than 50% required skills matched');
    return breakdown;
  }
  breakdown.skills = skillRatio * WEIGHTS.skills;

  // Required languages presence
  const missingLanguage = requiredLanguages.some(l => !agentLanguages.includes(l));
  if (missingLanguage) {
    breakdown.disqualified = true;
    breakdown.reasons.push('Missing a required language');
    return breakdown;
  }
  const languagePresenceRatio = requiredLanguages.length === 0
    ? 1
    : requiredLanguages.filter(l => agentLanguages.includes(l)).length / requiredLanguages.length;
  breakdown.languages = languagePresenceRatio * WEIGHTS.languages;

  // Language proficiency (agent vs minimumL1Score)
  const agentLevelNum = LANGUAGE_LEVEL_MAP[agentLanguageLevel] || 1;
  const requiredLevelNum = LANGUAGE_LEVEL_MAP[opportunity.minimumL1Score] || 1;
  if (agentLevelNum < requiredLevelNum) {
    breakdown.disqualified = true;
    breakdown.reasons.push(`Language level too low (${agentLanguageLevel} < ${opportunity.minimumL1Score})`);
    return breakdown;
  }
  // Give proportional score: exact or higher full, else scale.
  const levelRatio = agentLevelNum >= requiredLevelNum
    ? 1
    : agentLevelNum / requiredLevelNum;
  breakdown.languageLevel = levelRatio * WEIGHTS.languageLevel;

  // Qualifications
  const requiredQuals = safeParse(opportunity.minimumQualifications);
  if (!requiredQuals || !Array.isArray(requiredQuals) || requiredQuals.length === 0) {
    breakdown.qualifications = WEIGHTS.qualifications;
  } else {
    const agentQuals = agent.qualifications.map(q => ({ type: q.type, field: q.field }));
    const matchCount = requiredQuals.filter(rq =>
      agentQuals.some(aq =>
        (!rq.type || aq.type === rq.type) &&
        (!rq.field || aq.field === rq.field)
      )
    ).length;
    const qualRatio = matchCount / requiredQuals.length;
    breakdown.qualifications = qualRatio * WEIGHTS.qualifications;
  }

  // Experience
  const prefExp = safeParse(opportunity.preferredExperience);
  const years = totalYears(agent.experiences);
  const yearsWeight = WEIGHTS.experience * 0.7;
  const domainWeight = WEIGHTS.experience * 0.3;

  if (!prefExp || (!prefExp.minYears && !prefExp.maxYears)) {
    breakdown.experienceYears = Math.min(years, 5) / 5 * yearsWeight;
  } else {
    const minY = prefExp.minYears ?? 0;
    const maxY = prefExp.maxYears ?? (minY + 3);
    if (years >= minY && years <= maxY) {
      breakdown.experienceYears = yearsWeight;
    } else {
      const mid = (minY + maxY) / 2;
      const span = Math.max(1, (maxY - minY) / 2);
      const diff = Math.abs(years - mid);
      const ratio = Math.max(0, 1 - diff / span);
      breakdown.experienceYears = ratio * yearsWeight;
    }
  }

  const domainRatio = domainAlignment(agent, opportunity);
  breakdown.experienceDomain = domainRatio * domainWeight;

  breakdown.experience = breakdown.experienceYears + breakdown.experienceDomain;

  // Total
  breakdown.total = Math.round(
    breakdown.skills +
    breakdown.qualifications +
    breakdown.experience +
    breakdown.languageLevel +
    breakdown.languages
  );

  return breakdown;
}

/*
  Controller: GET recommended opportunities.
  Query params:
    agentId (required)
    limit (optional, default 10)
*/
const agentOpportunities = async (req, res) => {
  try {
    const { agentId, limit = 10 } = req.query;
    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    // Load agent with related data used for scoring
    const agent = await prisma.agent.findUnique({
      where: { id: String(agentId) },
      include: {
        qualifications: true,
        experiences: true,
        employment: true
      }
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Optional KYC gate (uncomment if you want to restrict)
    // if (agent.kycStatus !== 'APPROVED') {
    //   return res.status(403).json({ success: false, message: 'KYC not approved' });
    // }

    // Fetch language tests (if model exists)
    /* For L1 Test Result
    const tests = await fetchLanguageTests(agent.id);
    const agentLanguageLevel = resolveAgentLanguageLevel(agent, tests);
    */
    // Fetch candidate opportunities
    const now = new Date();
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'OPEN',
        visibility: 'PUBLIC',
        deadline: { gt: now }
      },
      include: {
        project: true // for department / domain hints
      },
      orderBy: { createdAt: 'desc' }
    });

    // Score all
    const scored = opportunities.map(o => {
      const breakdown = scoreOpportunity(agent, o, agentLanguageLevel);
      if (breakdown.disqualified) return null;
      return {
        id: o.id,
        title: o.title,
        category: o.category,
        processType: o.processType,
        deadline: o.deadline,
        minimumL1Score: o.minimumL1Score,
        score: breakdown.total,
        breakdown
      };
    })
      .filter(Boolean)
      .filter(r => r.score >= 60) // threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit));

    return res.json({
      success: true,
      agentId,
      agentLanguageLevel,
      recommendedCount: scored.length,
      recommendations: scored,
      meta: {
        limit: Number(limit),
        considered: opportunities.length,
        threshold: 60
      }
    });
  } catch (error) {
    console.error('agentOpportunities error:', error);
    return res.status(500).json({ success: false, message: 'Cannot fetch opportunities' });
  }
};

export { agentOpportunities };