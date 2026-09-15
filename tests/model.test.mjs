import test from 'node:test';
import assert from 'node:assert/strict';
import {STATUS, evaluateAssessment} from '../src/model.js';

function input(overrides = {}) {
  return {assessmentId:'SYN',month:'2026-08',workUnit:'Synthetic clinic',position:'Synthetic role',salaryGrade:'15',workStatus:'Full-time',salary:'40000',workingHours:'176',workingHoursRef:'SYN-WM',establishmentCoverage:'Yes',workerCoverage:'Yes',excludedDays:'0',determination:'Approved',determinationRef:'SYN-DET',dohApproval:'Approved',dohApprovalRef:'SYN-DOH',classification:'Not specified',classificationRef:'',...overrides};
}
function entries(hours=88) {
  return [{id:'T1',date:'2026-08-01',task:'Synthetic hazardous task',start:'',end:'',directHours:String(hours),code:'3.2.2',pathway:'Synthetic pathway',evidence:'SYN-E',confirmed:'Yes'}];
}

test('exact 50 percent boundary',()=>{ const r=evaluateAssessment(input(),entries(88)); assert.equal(r.status,STATUS.APPROVED); assert.equal(r.estimate,10000); });
test('below threshold suppresses amount',()=>{ const r=evaluateAssessment(input(),entries(87)); assert.equal(r.status,STATUS.BELOW); assert.equal(r.estimate,null); });
test('part-time factor is one half',()=>{ const r=evaluateAssessment(input({salaryGrade:'24',salary:'100000',workStatus:'Part-time',workingHours:'88'}),entries(50)); assert.equal(r.status,STATUS.APPROVED); assert.equal(r.estimate,5000); });
test('pending approval suppresses amount',()=>{ const r=evaluateAssessment(input({dohApproval:'Missing',dohApprovalRef:''}),entries(100)); assert.equal(r.status,STATUS.PENDING); assert.equal(r.estimate,null); });
test('11 excluded days overrides threshold',()=>{ const r=evaluateAssessment(input({excludedDays:'11'}),entries(100)); assert.equal(r.status,STATUS.EXCLUDED); });
test('hours greater than denominator route to manual review',()=>{ const r=evaluateAssessment(input(),entries(180)); assert.equal(r.status,STATUS.INCOMPLETE); });
test('salary grade 32 routes to manual review',()=>{ const r=evaluateAssessment(input({salaryGrade:'32'}),entries(100)); assert.equal(r.status,STATUS.INCOMPLETE); assert.equal(r.rate,null); });
test('coverage no routes out of scope',()=>{ const r=evaluateAssessment(input({workerCoverage:'No'}),entries(100)); assert.equal(r.status,STATUS.OUT_OF_SCOPE); });
test('overlapping intervals are flagged and excluded',()=>{ const e=[{id:'T1',date:'2026-08-01',task:'A',start:'08:00',end:'12:00',directHours:'',code:'3.2.2',pathway:'P',evidence:'E1',confirmed:'Yes'},{id:'T2',date:'2026-08-01',task:'B',start:'10:00',end:'13:00',directHours:'',code:'3.2.3',pathway:'P',evidence:'E2',confirmed:'Yes'}]; const r=evaluateAssessment(input(),e); assert.equal(r.status,STATUS.INCOMPLETE); assert.equal(r.validHours,0); });
