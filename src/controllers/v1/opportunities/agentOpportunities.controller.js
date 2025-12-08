import prisma from '../../../config/db.js';  


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

  //Breakdown is an object containing scores of particular parameter like skills,experience etc..
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
 

  //skills required by opportunity
  const requiredSkills = opportunity.minimumSkills || [];
  //skills that the agent have
  const agentSkills = agent.skills || [];
  //languages that are required by opportunity
  const requiredLanguages = opportunity.requiredLanguages || [];
  // languages that the agent is fluent in
  const agentLanguages = agent.languages || [];

  // Skills ratio
  //Matching the skills that agent has and opportunity requires and returning its length
  const matchedSkills = requiredSkills.filter(s => agentSkills.includes(s)).length;
  //Ratio of agent matched skills and required by opportunity
  const skillRatio = requiredSkills.length === 0 ? 1 : matchedSkills / requiredSkills.length;

  //If skill ratio is less(according to our requirement) then stop the function
  if (skillRatio < 0.5) {
    breakdown.disqualified = true;
    breakdown.reasons.push('Less than 50% required skills matched');
    return breakdown;
  }
  //Pushing the skill score match to the breakdown object
  breakdown.skills = skillRatio * WEIGHTS.skills;

  // Required languages presence
  //So .some() iterates over each element of an array and then stops iterating if callback returns true and then returns true
  //Checks if all languages required is actually known by agent
  const missingLanguage = requiredLanguages.some(l => !agentLanguages.includes(l));

  //If there is any missing language stop the function and disqualified
  if (missingLanguage) {
    breakdown.disqualified = true;
    breakdown.reasons.push('Missing a required language');
    return breakdown;
  }

  //Calculating the ratio of language match between agent and opportunity
  const languagePresenceRatio = requiredLanguages.length === 0
    ? 1
    : requiredLanguages.filter(l => agentLanguages.includes(l)).length / requiredLanguages.length;

  //Calculating the score of language match and assigning it to object
  breakdown.languages = languagePresenceRatio * WEIGHTS.languages;


  // Language proficiency (agent vs minimumL1Score)
  //Rating (mapped to number) of agent language test level
  const agentLevelNum = LANGUAGE_LEVEL_MAP[agentLanguageLevel] || 1;
  //Rating (mapped to number) of required level by opportunity
  const requiredLevelNum = LANGUAGE_LEVEL_MAP[opportunity.minimumL1Score] || 1;

  //If rating of agent lower than opportunity required then stop the function
  if (agentLevelNum < requiredLevelNum) {
    breakdown.disqualified = true;
    breakdown.reasons.push(`Language level too low (${agentLanguageLevel} < ${opportunity.minimumL1Score})`);
    return breakdown;
  }

  // Give proportional score: exact or higher full, else scale.
  //Ratio of agent language level and opportunity required level
  const levelRatio = agentLevelNum >= requiredLevelNum
    ? 1
    : agentLevelNum / requiredLevelNum;

  //Score of the agent language level 
  breakdown.languageLevel = levelRatio * WEIGHTS.languageLevel;

  // Qualifications
  //safeParse actually takes the array of json objects and then returns the array of normal objects
  const requiredQuals = safeParse(opportunity.minimumQualifications);

  //If block - If required qualifications is not present or other conditions become true then add the entire score 
  //Else Blocks - Basically check the match count of required qualifications and agent qualifications
  if (!requiredQuals || !Array.isArray(requiredQuals) || requiredQuals.length === 0) {
    breakdown.qualifications = WEIGHTS.qualifications;
  } else {
    //So this actually converts the agent qualifications array to its required type
    const agentQuals = agent.qualifications.map(q => ({ type: q.type, field: q.field }));

    //Checking the count of matched qualifications between agent and opportunity required
    const matchCount = requiredQuals.filter(rq =>
      agentQuals.some(aq =>
        (!rq.type || aq.type === rq.type) &&
        (!rq.field || aq.field === rq.field)
      )
    ).length;
    //Getting the ratio of both
    const qualRatio = matchCount / requiredQuals.length;
    //Adding the score of both
    breakdown.qualifications = qualRatio * WEIGHTS.qualifications;
  }

 

  // Experience (redesigned for preferredExperience as an array:
  // e.g. [{ experienceMin:1, experienceMax:2, industry:"BPO", vertical:"CHAT_SUPPORT" }])

  const prefArray = (() => {
    const parsed = safeParse(opportunity.preferredExperience);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  })();

  //Total number of experience years that the agent has
  const totalAgentYears = totalYears(agent.experiences);
  //Score of the years parameter in experience matching
  const yearsWeight = WEIGHTS.experience * 0.7;
  //Score of the domain parameter in experience matching
  const domainWeight = WEIGHTS.experience * 0.3;

  //~~~~~~ Comments till here 

  // Years ratio
  let yearsRatio;
  if (!prefArray) {
    // No structured preferences: simple cap at 5 years
    yearsRatio = Math.min(totalAgentYears, 5) / 5;
  } else {
    let best = 0;
    for (const p of prefArray) {
      const minY = p.experienceMin ?? 0;
      const maxY = p.experienceMax ?? (minY + 3);
      let r;
      if (totalAgentYears >= minY && totalAgentYears <= maxY) {
        r = 1;
      } else if (totalAgentYears < minY) {
        r = minY === 0 ? 1 : totalAgentYears / minY; // below range
      } else { // totalAgentYears > maxY
        r = maxY / totalAgentYears; // above range
      }
      best = Math.max(best, Math.min(r, 1));
    }
    yearsRatio = best;
  }

  // Domain ratio
  let domainRatio;
  if (!prefArray) {
    domainRatio = domainAlignment(agent, opportunity); // fallback heuristic (0, 0.5, 1)
  } else {
    const agentIndustries = agent.experiences.map(e => e.industry).filter(Boolean);
    const agentVerticals = agent.experiences.map(e => e.vertical).filter(Boolean);

    const requiredIndustries = [...new Set(prefArray.map(p => p.industry).filter(Boolean))];
    const requiredVerticals = [...new Set(prefArray.map(p => p.vertical).filter(Boolean))];

    const industryHit = requiredIndustries.length === 0
      ? 1
      : requiredIndustries.some(i => agentIndustries.includes(i)) ? 1 : 0;

    const verticalHit = requiredVerticals.length === 0
      ? 1
      : requiredVerticals.some(v => agentVerticals.includes(v)) ? 1 : 0;

    domainRatio = (industryHit + verticalHit) / 2; // 0, 0.5, or 1
  }

  breakdown.experienceYears = yearsRatio * yearsWeight;
  breakdown.experienceDomain = domainRatio * domainWeight;
  breakdown.experience = breakdown.experienceYears + breakdown.experienceDomain;
// End of all individual scores

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