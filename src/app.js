import {CIRCUMSTANCES, STATUS, evaluateAssessment} from './model.js';

const ids = ['assessmentId','month','workUnit','position','salaryGrade','workStatus','salary','workingHours','workingHoursRef','establishmentCoverage','workerCoverage','excludedDays','determination','determinationRef','dohApproval','dohApprovalRef','classification','classificationRef'];
const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const exposureBody = document.getElementById('exposure-body');

function circumstanceOptions(selected = '') {
  return `<option value="">Select code</option>${CIRCUMSTANCES.map(([code, label]) => `<option value="${code}" ${selected === code ? 'selected' : ''}>${code} — ${label}</option>`).join('')}`;
}

function addEntry(entry = {}) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input data-field="id" aria-label="Entry ID" value="${escapeValue(entry.id || '')}" placeholder="SYN-T01"></td>
    <td><input data-field="date" aria-label="Exposure date" type="date" value="${escapeValue(entry.date || '')}"></td>
    <td class="task-cell"><input data-field="task" aria-label="Actual task" value="${escapeValue(entry.task || '')}" placeholder="Describe actual task"></td>
    <td class="time-cell"><div class="time-grid"><input data-field="start" aria-label="Start time" type="time" value="${escapeValue(entry.start || '')}"><input data-field="end" aria-label="End time" type="time" value="${escapeValue(entry.end || '')}"></div><input class="hours-input" data-field="directHours" aria-label="Direct unique hours" type="number" min="0" step="0.01" value="${escapeValue(entry.directHours ?? '')}" placeholder="or unique hours"></td>
    <td><select data-field="code" aria-label="JC 3.2 code">${circumstanceOptions(entry.code)}</select></td>
    <td><input data-field="pathway" aria-label="Exposure event or pathway" value="${escapeValue(entry.pathway || '')}" placeholder="Exposure pathway"></td>
    <td><input data-field="evidence" aria-label="Evidence reference" value="${escapeValue(entry.evidence || '')}" placeholder="SYN-EVID-01"></td>
    <td><select data-field="confirmed" aria-label="Supervisor confirmation"><option ${entry.confirmed !== 'Yes' ? 'selected' : ''}>No</option><option ${entry.confirmed === 'Yes' ? 'selected' : ''}>Yes</option></select></td>
    <td><span class="integrity">Not reviewed</span></td>
    <td><button class="button danger remove-entry" type="button" aria-label="Remove exposure entry">Remove</button></td>`;
  row.querySelectorAll('input,select').forEach(control => control.addEventListener('input', calculate));
  row.querySelector('.remove-entry').addEventListener('click', () => { row.remove(); calculate(); });
  exposureBody.appendChild(row);
}

function escapeValue(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function readInput() {
  return Object.fromEntries(ids.map(id => [id, elements[id].value]));
}

function readEntries() {
  return [...exposureBody.querySelectorAll('tr')].map(row => Object.fromEntries([...row.querySelectorAll('[data-field]')].map(control => [control.dataset.field, control.value])));
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'n.a.';
}

function calculate() {
  const result = evaluateAssessment(readInput(), readEntries());
  const rows = [...exposureBody.querySelectorAll('tr')];
  rows.forEach(row => {
    const badge = row.querySelector('.integrity');
    badge.textContent = 'Not reviewed';
    badge.className = 'integrity';
  });
  result.reviewedEntries.forEach(entry => {
    const badge = rows[entry.sourceIndex]?.querySelector('.integrity');
    if (!badge) return;
    badge.textContent = entry.valid ? `${formatNumber(entry.hours)} h · Valid` : entry.issues.join('; ');
    badge.className = `integrity ${entry.valid ? 'valid' : 'issue'}`;
  });

  document.getElementById('metric-hm').textContent = formatNumber(result.validHours);
  document.getElementById('metric-wm').textContent = formatNumber(result.wm);
  document.getElementById('metric-em').textContent = result.ratio === null ? 'n.a.' : `${(result.ratio * 100).toFixed(2)}%`;
  document.getElementById('metric-rate').textContent = result.rate === null ? 'n.a.' : `${(result.rate * 100).toFixed(0)}%`;
  document.getElementById('status-text').textContent = result.status;
  document.getElementById('status-explanation').textContent = result.explanation;
  const statusCard = document.getElementById('status-card');
  statusCard.className = `status-card ${result.status === STATUS.APPROVED ? 'success' : result.status === STATUS.INCOMPLETE ? 'problem' : ''}`;
  const findings = result.issues.length ? result.issues : [result.explanation, `Threshold: ${result.ratio !== null && result.ratio >= .5 ? 'met' : 'not met'}.`, `Work status factor: ${result.factor.toFixed(2)}.`];
  document.getElementById('finding-list').innerHTML = findings.map(item => `<li>${escapeValue(item)}</li>`).join('');
  document.getElementById('estimate').textContent = result.estimate === null ? 'Not displayed' : `₱${result.estimate.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('estimate-note').textContent = result.estimate === null ? 'The amount is suppressed until every documentary and approval gate is met.' : 'Conditional estimate only. Authorized officials retain responsibility for all legal and payment decisions.';
  return result;
}

function loadExample() {
  const values = {
    assessmentId:'SYN-01', month:'2026-08', workUnit:'Synthetic City Health Clinic', position:'Nurse I (synthetic)', salaryGrade:'15', workStatus:'Full-time', salary:'40000', workingHours:'176', workingHoursRef:'SYN-DUTY-01', establishmentCoverage:'Yes', workerCoverage:'Yes', excludedDays:'0', determination:'Approved', determinationRef:'SYN-DET-01', dohApproval:'Approved', dohApprovalRef:'SYN-DOH-01', classification:'Not specified', classificationRef:''
  };
  ids.forEach(id => { elements[id].value = values[id] ?? ''; });
  exposureBody.innerHTML = '';
  addEntry({id:'SYN-T01',date:'2026-08-05',task:'Provide direct care with communicable-disease exposure',directHours:'44',code:'3.2.2',pathway:'Direct outpatient contact',evidence:'SYN-EVID-01',confirmed:'Yes'});
  addEntry({id:'SYN-T02',date:'2026-08-12',task:'Handle infectious specimens during clinic service',directHours:'44',code:'3.2.3',pathway:'Specimen handling',evidence:'SYN-EVID-02',confirmed:'Yes'});
  calculate();
}

function clearAll() {
  ids.forEach(id => { elements[id].value = ''; });
  elements.establishmentCoverage.value = 'Unresolved';
  elements.workerCoverage.value = 'Unresolved';
  elements.determination.value = 'Missing';
  elements.dohApproval.value = 'Missing';
  elements.classification.value = 'Not specified';
  exposureBody.innerHTML = '';
  addEntry();
  calculate();
}

function showTab(id) {
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === id));
  document.querySelectorAll('.tab-button').forEach(button => button.classList.toggle('active', button.dataset.tab === id));
  document.getElementById(id).focus({preventScroll:true});
  window.scrollTo({top: document.querySelector('.tabs').offsetTop - 44, behavior:'smooth'});
}

document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
document.getElementById('add-entry').addEventListener('click', () => { addEntry(); calculate(); });
document.getElementById('load-example').addEventListener('click', loadExample);
document.getElementById('clear-all').addEventListener('click', clearAll);
document.getElementById('review-results').addEventListener('click', () => { calculate(); showTab('results'); });
document.getElementById('print-summary').addEventListener('click', () => window.print());
document.querySelectorAll('#assessment-form input, #assessment-form select').forEach(control => control.addEventListener('input', calculate));

loadExample();
