// Controllers/SalaryController.js
const mongoose   = require("mongoose");
const Finance    = require("../Model/FinanceSalaryModel");
const Advance    = require("../Model/AdvanceModel");
const Attendance = require("../Model/AttendanceModel");

function toNumberSafe(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function currentPeriod() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

/* --------------------------- per-employee calc --------------------------- */
async function calculateSalary(req, res) {
  try {
    const empId = String(req.query.empId || "").trim();
    const period = req.query.period || currentPeriod();
    if (!empId) return res.status(400).json({ message: "empId is required" });

    const emp = await Finance.findOne({ EmpId: empId }).lean().exec();
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    const basic =
      toNumberSafe(emp.Base_Sal ??
                   emp.Basic_Salary ??
                   emp.baseSalary ??
                   emp.Base_Salary);

    let att = await Attendance.findOne({ empId, period }).lean().exec();
    if (!att) att = await Attendance.findOne({ empId }).sort({ createdAt: -1 }).lean().exec() || {};

    let adv = await Advance.findOne({ empId, period }).lean().exec();
    if (!adv) adv = await Advance.findOne({ empId }).sort({ createdAt: -1 }).lean().exec() || {};

    const col   = toNumberSafe(adv.costOfLiving);
    const food  = toNumberSafe(adv.food);
    const conv  = toNumberSafe(adv.conveyance);
    const med   = toNumberSafe(adv.medical);
    const perf  = toNumberSafe(adv.bonus);
    const attendBonus = toNumberSafe(adv.attendance);
    const reimbursements = toNumberSafe(adv.reimbursements);

    const workingDays = toNumberSafe(att.workingDays);
    const otHrs       = toNumberSafe(att.overtimeHrs);
    const noPayLeave  = toNumberSafe(att.noPayLeave);

    const hourlyRate   = basic > 0 ? basic / (22 * 8) : 0;
    const overtimePay  = otHrs * hourlyRate * 1.5;
    const noPay        = (basic / 22) * noPayLeave;

    const totalAllowances = col + food + conv + med;
    const gross           = basic + totalAllowances;

    const bonus = perf + attendBonus;

    const salaryBeforeDeduction = gross + overtimePay + bonus + reimbursements;

    const epfEmp = salaryBeforeDeduction * 0.08;
    const epfEr  = salaryBeforeDeduction * 0.12;
    const etf    = salaryBeforeDeduction * 0.03;
    const apit   = 0;
    const salaryAdvance = 0;

    const totalDeductions = noPay + salaryAdvance + apit + epfEmp + etf;
    const netPayable      = salaryBeforeDeduction - totalDeductions;

    return res.json({
      employee: {
        id: emp.EmpId,
        name: emp.Emp_Name,
        designation: emp.Designation,
        epf: emp.Epf_No,
        bankName: emp.Bank_Name,
        branch: emp.branch,
        accNo: emp.Acc_No,
      },
      attendance: {
        period: att?.period || period,
        workingDays, overtimeHrs: otHrs, leaveAllowed: toNumberSafe(att.leaveAllowed),
        noPayLeave, leaveTaken: toNumberSafe(att.leaveTaken), other: att?.other || ""
      },
      advance: {
        period: adv?.period || period,
        costOfLiving: col, food, conveyance: conv, medical: med,
        bonus: perf, attendance: attendBonus, reimbursements
      },
      numbers: {
        basic, col, food, conv, med, bonus,
        reimbursements, overtimePay, noPay, totalAllowances, gross,
        salaryBeforeDeduction, epfEmp, epfEr, etf, apit, salaryAdvance,
        totalDeductions, netPayable
      }
    });
  } catch (err) {
    console.error("[salary:calc]", err);
    res.status(500).json({ message: "Error calculating salary" });
  }
}

/* ------------------------ ALL employees: total net ----------------------- */
/**
 * GET /salary/summary?period=YYYY-MM
 * Sums NET salary (netPayable) across all employees for the period.
 * If a given employee has no record for the period, uses that employee's latest
 * attendance/advance as a fallback.
 * Returns: { totalNet, employeesCount, period }
 */
async function salarySummary(req, res) {
  try {
    const period = req.query.period || currentPeriod();

    // employees (EmpId + Base_Sal only)
    const employees = await Finance.find(
      {},
      { EmpId: 1, Emp_Name: 1, Base_Sal: 1, _id: 0 }
    ).lean().exec();

    const empIds = employees.map(e => e.EmpId);

    // period records
    const [attsPeriod, advsPeriod] = await Promise.all([
      Attendance.find({ empId: { $in: empIds }, period }).lean().exec(),
      Advance.find({ empId: { $in: empIds }, period }).lean().exec(),
    ]);
    const attMap = new Map(attsPeriod.map(a => [a.empId, a]));
    const advMap = new Map(advsPeriod.map(a => [a.empId, a]));

    // need fallbacks for missing
    const missingAttIds = empIds.filter(id => !attMap.has(id));
    const missingAdvIds = empIds.filter(id => !advMap.has(id));

    if (missingAttIds.length) {
      const latestAtt = await Attendance.aggregate([
        { $match: { empId: { $in: missingAttIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$empId", doc: { $first: "$$ROOT" } } },
      ]);
      latestAtt.forEach(x => attMap.set(x._id, x.doc));
    }

    if (missingAdvIds.length) {
      const latestAdv = await Advance.aggregate([
        { $match: { empId: { $in: missingAdvIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$empId", doc: { $first: "$$ROOT" } } },
      ]);
      latestAdv.forEach(x => advMap.set(x._id, x.doc));
    }

    // compute per-employee, sum
    let totalNet = 0;
    let countUsed = 0;

    for (const emp of employees) {
      const basic = toNumberSafe(emp.Base_Sal);
      const att = attMap.get(emp.EmpId) || {};
      const adv = advMap.get(emp.EmpId) || {};

      const col   = toNumberSafe(adv.costOfLiving);
      const food  = toNumberSafe(adv.food);
      const conv  = toNumberSafe(adv.conveyance);
      const med   = toNumberSafe(adv.medical);
      const perf  = toNumberSafe(adv.bonus);
      const attendBonus = toNumberSafe(adv.attendance);
      const reimbursements = toNumberSafe(adv.reimbursements);

      const otHrs      = toNumberSafe(att.overtimeHrs);
      const noPayLeave = toNumberSafe(att.noPayLeave);

      const hourlyRate   = basic > 0 ? basic / (22 * 8) : 0;
      const overtimePay  = otHrs * hourlyRate * 1.5;
      const noPay        = (basic / 22) * noPayLeave;

      const totalAllowances = col + food + conv + med;
      const gross           = basic + totalAllowances;
      const bonus           = perf + attendBonus;

      const salaryBeforeDeduction = gross + overtimePay + bonus + reimbursements;

      const epfEmp = salaryBeforeDeduction * 0.08;
      const etf    = salaryBeforeDeduction * 0.03;
      const apit   = 0;
      const salaryAdvance = 0;

      const totalDeductions = noPay + salaryAdvance + apit + epfEmp + etf;
      const netPayable      = salaryBeforeDeduction - totalDeductions;

      if (Number.isFinite(netPayable)) {
        totalNet += netPayable;
        countUsed += 1;
      }
    }

    return res.json({
      totalNet: Math.round(totalNet),
      employeesCount: countUsed,
      period,
    });
  } catch (err) {
    console.error("[salary:summary]", err);
    res.status(500).json({ message: "Failed to load salary summary" });
  }
}

module.exports = { calculateSalary, salarySummary };
