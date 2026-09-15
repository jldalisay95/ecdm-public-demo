export const STATUS = Object.freeze({
  INCOMPLETE: "INCOMPLETE—MANUAL REVIEW",
  OUT_OF_SCOPE: "OUT OF SCOPE—COVERAGE NOT CONFIRMED",
  EXCLUDED: "NOT PAYABLE THIS MONTH—11+ EXCLUDED DAYS",
  BELOW: "BELOW 50% DOCUMENTED EXPOSURE",
  PENDING: "MEETS DOCUMENTARY THRESHOLD—APPROVAL PENDING",
  APPROVED: "APPROVED—POLICY-RATE ESTIMATE"
});

export const CIRCUMSTANCES = Object.freeze([
  ["3.2.1", "Hospital or similar facility: contagious-patient contact or used paraphernalia"],
  ["3.2.2", "Health office, RHU, or health centre: contagious outpatient exposure"],
  ["3.2.3", "Health-related office: patients, specimens, chemicals, or hazardous items"],
  ["3.2.4", "Radiation-emitting equipment, radioactive materials, or toxic substances"],
  ["3.2.5", "Chemical or medical laboratory and related inspection functions"],
  ["3.2.6", "Prison camp or mental-health institution: bodily-harm risk"],
  ["3.2.7", "Drug treatment or rehabilitation setting: bodily-harm risk"],
  ["3.2.8", "Rescue operation or evacuation during calamity or health emergency"],
  ["3.2.9", "Highly disease-infected or vector-infested area"],
  ["3.2.10", "Handling or spraying hazardous chemicals or pesticides"],
  ["3.2.11", "Direct handling of laboratory animals"],
  ["3.2.12", "Certified embattled or strife-torn area"],
  ["3.2.13", "DOH-identified geographically isolated and disadvantaged area"],
  ["3.2.14", "Administrative-support work exposed to occupational risk or physical hardship"]
]);

export function rateForGrade(grade) {
  const sg = Number(grade);
  if (!Number.isInteger(sg) || sg < 1 || sg > 31) return null;
  if (sg <= 19) return 0.25;
  return ({20: 0.15, 21: 0.13, 22: 0.12, 23: 0.11, 24: 0.10, 25: 0.10, 26: 0.09, 27: 0.08, 28: 0.07, 29: 0.06, 30: 0.06, 31: 0.05})[sg];
}

function timeToMinutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function anyEntryValue(entry) {
  return Object.values(entry).some(value => String(value ?? "").trim() !== "");
}

export function reviewEntries(entries) {
  const active = entries
    .map((entry, sourceIndex) => ({...entry, sourceIndex}))
    .filter(({sourceIndex, ...entry}) => anyEntryValue(entry));
  const duplicateIds = new Set();
  const idCounts = new Map();
  active.forEach(entry => {
    const id = String(entry.id || "").trim();
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  });
  idCounts.forEach((count, id) => { if (count > 1) duplicateIds.add(id); });

  const reviewed = active.map((entry, index) => {
    const issues = [];
    const id = String(entry.id || "").trim();
    const direct = entry.directHours === "" || entry.directHours == null ? null : Number(entry.directHours);
    const start = timeToMinutes(entry.start);
    const end = timeToMinutes(entry.end);
    const hasTimes = Boolean(entry.start || entry.end);
    let hours = 0;

    if (!id) issues.push("Missing entry ID");
    if (duplicateIds.has(id)) issues.push("Duplicate entry ID");
    if (!entry.date) issues.push("Missing date");
    if (!String(entry.task || "").trim()) issues.push("Missing actual task");
    if (!CIRCUMSTANCES.some(([code]) => code === entry.code)) issues.push("Missing or unsupported JC 3.2 code");
    if (!String(entry.pathway || "").trim()) issues.push("Missing exposure event or pathway");
    if (!String(entry.evidence || "").trim()) issues.push("Missing evidence reference");
    if (entry.confirmed !== "Yes") issues.push("Supervisor confirmation missing");

    if (direct !== null && hasTimes) {
      issues.push("Use direct hours or start/end times, not both");
    } else if (direct !== null) {
      if (!Number.isFinite(direct) || direct <= 0) issues.push("Direct hours must be greater than zero");
      else hours = direct;
    } else if (hasTimes) {
      if (start === null || end === null || end <= start) issues.push("Invalid start or end time");
      else hours = (end - start) / 60;
    } else {
      issues.push("Missing exposure hours");
    }

    return {...entry, index, id, startMinutes: start, endMinutes: end, hours, issues};
  });

  for (let i = 0; i < reviewed.length; i += 1) {
    for (let j = i + 1; j < reviewed.length; j += 1) {
      const a = reviewed[i];
      const b = reviewed[j];
      if (a.date && a.date === b.date && a.startMinutes !== null && a.endMinutes !== null && b.startMinutes !== null && b.endMinutes !== null && a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
        a.issues.push(`Overlaps entry ${b.id || j + 1}`);
        b.issues.push(`Overlaps entry ${a.id || i + 1}`);
      }
    }
  }

  reviewed.forEach(entry => { entry.valid = entry.issues.length === 0; });
  return reviewed;
}

export function evaluateAssessment(input, entries) {
  const reviewedEntries = reviewEntries(entries);
  const validHours = reviewedEntries.filter(entry => entry.valid).reduce((sum, entry) => sum + entry.hours, 0);
  const wm = Number(input.workingHours);
  const salary = Number(input.salary);
  const grade = Number(input.salaryGrade);
  const excludedDays = Number(input.excludedDays);
  const rate = rateForGrade(grade);
  const ratio = Number.isFinite(wm) && wm > 0 ? validHours / wm : null;
  const issues = [];

  if (!String(input.assessmentId || "").trim()) issues.push("Assessment ID is required");
  if (!input.month) issues.push("Assessment month is required");
  if (!String(input.workUnit || "").trim()) issues.push("Assignment or work unit is required");
  if (!Number.isInteger(grade) || grade < 1 || grade > 31) issues.push("Salary grade must be 1–31; SG 32 or above requires authorized review");
  if (!['Full-time', 'Part-time'].includes(input.workStatus)) issues.push("Work status must be confirmed");
  if (!Number.isFinite(salary) || salary <= 0) issues.push("Confirmed FTE monthly basic salary is required");
  if (!Number.isFinite(wm) || wm <= 0) issues.push("Authorized working hours must be greater than zero");
  if (!String(input.workingHoursRef || "").trim()) issues.push("Working-hours evidence reference is required");
  if (!['Yes', 'No'].includes(input.establishmentCoverage)) issues.push("Government health-establishment coverage is unresolved");
  if (!['Yes', 'No'].includes(input.workerCoverage)) issues.push("Public-health-worker coverage is unresolved");
  if (!Number.isInteger(excludedDays) || excludedDays < 0) issues.push("Excluded days must be a non-negative whole number");
  if (!['Approved', 'Pending', 'Missing'].includes(input.determination)) issues.push("Determination status is invalid");
  if (input.determination === 'Approved' && !String(input.determinationRef || '').trim()) issues.push("Approved determination requires a reference");
  if (!['Approved', 'Pending', 'Missing'].includes(input.dohApproval)) issues.push("DOH approval status is invalid");
  if (input.dohApproval === 'Approved' && !String(input.dohApprovalRef || '').trim()) issues.push("Approved DOH approval requires a reference");
  if (input.classification === 'Unresolved') issues.push("Authorized high/low classification is unresolved");
  if (['High', 'Low'].includes(input.classification) && !String(input.classificationRef || '').trim()) issues.push("High or Low classification requires an authorized written reference");
  reviewedEntries.filter(entry => !entry.valid).forEach(entry => issues.push(`${entry.id || `Entry ${entry.index + 1}`}: ${entry.issues.join('; ')}`));
  if (Number.isFinite(wm) && validHours > wm) issues.push("Documented valid exposure hours exceed authorized working hours");

  let status;
  let explanation;
  if (issues.length) {
    status = STATUS.INCOMPLETE;
    explanation = "Resolve the listed missing, contradictory, integrity, denominator, classification, or salary-grade issue.";
  } else if (input.establishmentCoverage === 'No' || input.workerCoverage === 'No') {
    status = STATUS.OUT_OF_SCOPE;
    explanation = "Coverage was not confirmed. Refer the coverage question to the authorized office.";
  } else if (excludedDays >= 11) {
    status = STATUS.EXCLUDED;
    explanation = "The monthly exclusion gate applies. Retain the authorized absence or training record.";
  } else if (ratio < 0.5) {
    status = STATUS.BELOW;
    explanation = "Documented valid exposure was below 50% of authorized working hours. No amount is displayed.";
  } else if (input.determination !== 'Approved' || input.dohApproval !== 'Approved') {
    status = STATUS.PENDING;
    explanation = "The documentary threshold was met, but the required determination or approval was not complete.";
  } else {
    status = STATUS.APPROVED;
    explanation = "All encoded documentary gates were met. The amount remains a conditional estimate for authorized review.";
  }

  const factor = input.workStatus === 'Part-time' ? 0.5 : 1;
  const estimate = status === STATUS.APPROVED && rate !== null ? Math.round((salary * rate * factor + Number.EPSILON) * 100) / 100 : null;
  return {status, explanation, issues, reviewedEntries, validHours, wm, ratio, rate, factor, estimate};
}
