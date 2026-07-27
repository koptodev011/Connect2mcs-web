'use client';

import { RecommendationResponse, CareerPath, FinancialProjection } from '@/types/career-simulator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Users, MapPin, Clock, Shield } from 'lucide-react';
import { Card, SectionHead } from '@/components/primitives';
import { C, F } from '@/lib/tokens';

interface ResultsProps {
  recommendations: RecommendationResponse;
  userAge?: number;
}

export default function Results({ recommendations, userAge }: ResultsProps) {
  const { top_career_paths, financial_projections, next_steps } = recommendations;

  const salaryData = top_career_paths.map(career => ({
    name: career.title,
    min: parseInt(career.salary_range.split('-')[0].replace(/[^0-9]/g, '')) || 0,
    max: parseInt(career.salary_range.split('-')[1]?.replace(/[^0-9]/g, '') || career.salary_range.replace(/[^0-9]/g, '')) || 0,
  }));

  const prepareWealthProjectionData = (proj: FinancialProjection) => {
    const salary_1_5 = (proj.year_1_5.salary || 0) / 100000;
    const savings_1_5 = (proj.year_1_5.savings || 0) / 100000;
    const salary_6_10 = (proj.year_6_10.salary || 0) / 100000;
    const savings_6_10 = (proj.year_6_10.savings || 0) / 100000;
    const salary_11_15 = (proj.year_11_15.salary || 0) / 100000;
    const savings_11_15 = (proj.year_11_15.savings || 0) / 100000;
    const salary_16_20 = (proj.year_16_20.salary || 0) / 100000;
    const savings_16_20 = (proj.year_16_20.savings || 0) / 100000;

    const avgSalary_0_2 = salary_1_5 * 0.4;
    const avgSalary_2_4 = salary_1_5 * 0.7;
    const avgSalary_4_6 = salary_1_5 * 0.9;
    const avgSalary_6_8 = salary_1_5;
    const avgSalary_10_15 = (salary_6_10 + salary_11_15) / 2;
    const avgSalary_15_20 = salary_16_20;

    let cumulativeSavings = 0;
    cumulativeSavings += (savings_1_5 * 0.4) * 2; const cumulative_0_2 = cumulativeSavings;
    cumulativeSavings += (savings_1_5 * 0.7) * 2; const cumulative_2_4 = cumulativeSavings;
    cumulativeSavings += (savings_1_5 * 0.9) * 2; const cumulative_4_6 = cumulativeSavings;
    cumulativeSavings += savings_1_5 * 2; const cumulative_6_8 = cumulativeSavings;
    cumulativeSavings += savings_6_10 * 5; const cumulative_10_15 = cumulativeSavings;
    cumulativeSavings += (savings_11_15 * 2.5) + (savings_16_20 * 2.5); const cumulative_15_20 = cumulativeSavings;

    const investmentMultiplier = (years: number) => 1 + (years * 0.08);
    
    return [
      { period: '0-2 Yrs', annualSalary: Math.round(avgSalary_0_2 * 10) / 10, netWorth: Math.round((cumulative_0_2 * investmentMultiplier(1) + avgSalary_0_2 * 0.5) * 10) / 10, cumulativeSavings: Math.round(cumulative_0_2 * 10) / 10 },
      { period: '2-4 Yrs', annualSalary: Math.round(avgSalary_2_4 * 10) / 10, netWorth: Math.round((cumulative_2_4 * investmentMultiplier(3) + avgSalary_2_4 * 0.8) * 10) / 10, cumulativeSavings: Math.round(cumulative_2_4 * 10) / 10 },
      { period: '4-6 Yrs', annualSalary: Math.round(avgSalary_4_6 * 10) / 10, netWorth: Math.round((cumulative_4_6 * investmentMultiplier(5) + avgSalary_4_6 * 1.0) * 10) / 10, cumulativeSavings: Math.round(cumulative_4_6 * 10) / 10 },
      { period: '6-8 Yrs', annualSalary: Math.round(avgSalary_6_8 * 10) / 10, netWorth: Math.round((cumulative_6_8 * investmentMultiplier(7) + avgSalary_6_8 * 1.2) * 10) / 10, cumulativeSavings: Math.round(cumulative_6_8 * 10) / 10 },
      { period: '10-15 Yrs', annualSalary: Math.round(avgSalary_10_15 * 10) / 10, netWorth: Math.round((cumulative_10_15 * investmentMultiplier(12) + avgSalary_10_15 * 2.0) * 10) / 10, cumulativeSavings: Math.round(cumulative_10_15 * 10) / 10 },
      { period: '15-20 Yrs', annualSalary: Math.round(avgSalary_15_20 * 10) / 10, netWorth: Math.round((cumulative_15_20 * investmentMultiplier(17) + avgSalary_15_20 * 3.0) * 10) / 10, cumulativeSavings: Math.round(cumulative_15_20 * 10) / 10 },
    ];
  };

  const parseCareerProgression = (career: CareerPath, financialProj?: FinancialProjection) => {
    const progression: any[] = [];
    const steps = career.steps || [];
    const currentAge = userAge || 20;
    
    const yearRanges = [
      { years: `${currentAge}-${currentAge + 1}`, period: 1, startYear: 0, endYear: 1 },
      { years: `${currentAge + 1}-${currentAge + 2}`, period: 1, startYear: 1, endYear: 2 },
      { years: `${currentAge + 2}-${currentAge + 4}`, period: 2, startYear: 2, endYear: 4 },
      { years: `${currentAge + 4}-${currentAge + 6}`, period: 2, startYear: 4, endYear: 6 },
      { years: `${currentAge + 6}-${currentAge + 8}`, period: 2, startYear: 6, endYear: 8 },
      { years: `${currentAge + 8}-${currentAge + 13}`, period: 5, startYear: 8, endYear: 13 },
      { years: `${currentAge + 13}-${currentAge + 18}`, period: 5, startYear: 13, endYear: 18 },
    ];

    const salaryMatch = career.salary_range.match(/(\d+)\s*-\s*(\d+)/i) || career.salary_range.match(/(\d+)/);
    const baseSalary = salaryMatch ? parseInt(salaryMatch[1]) : 6;
    const maxSalary = salaryMatch && salaryMatch[2] ? parseInt(salaryMatch[2]) : baseSalary * 10;
    const salaryIncrement = (maxSalary - baseSalary) / 6;

    const getSavings = (startYear: number, endYear: number) => {
      if (!financialProj) return null;
      if (startYear >= 0 && endYear <= 5) return Math.round(((financialProj.year_1_5.salary || 0) + (financialProj.year_1_5.savings || 0)) / 100000);
      if (startYear >= 6 && endYear <= 10) return Math.round(((financialProj.year_6_10.salary || 0) + (financialProj.year_6_10.savings || 0)) / 100000);
      if (startYear >= 11 && endYear <= 15) return Math.round(((financialProj.year_11_15.salary || 0) + (financialProj.year_11_15.savings || 0)) / 100000);
      if (startYear >= 16 && endYear <= 20) return Math.round(((financialProj.year_16_20.salary || 0) + (financialProj.year_16_20.savings || 0)) / 100000);
      return null;
    };

    yearRanges.forEach((range, index) => {
      const stepIndex = Math.min(index, steps.length - 1);
      const position = steps[stepIndex] || `Level ${index + 1} Position`;
      const stageSalary = Math.round(baseSalary + (salaryIncrement * index));
      const nextStageSalary = Math.round(baseSalary + (salaryIncrement * (index + 1)));
      
      let keyRequirement = 'Professional development';
      if (steps[stepIndex]) {
        const stepText = steps[stepIndex].toLowerCase();
        if (stepText.includes('intern') || stepText.includes('trainee')) keyRequirement = 'Strong basics, internships';
        else if (stepText.includes('engineer') || stepText.includes('assistant')) keyRequirement = 'Project delivery, certification';
        else if (stepText.includes('manager') || stepText.includes('senior')) keyRequirement = 'Team handling, MBA preferred';
        else if (stepText.includes('senior manager') || stepText.includes('lead')) keyRequirement = 'Leadership & cross-functional skills';
        else if (stepText.includes('business') || stepText.includes('unit')) keyRequirement = 'P&L knowledge, strategy';
        else if (stepText.includes('director') || stepText.includes('general')) keyRequirement = 'Revenue ownership';
        else if (stepText.includes('vp') || stepText.includes('head')) keyRequirement = 'Vision & business leadership';
      }

      const savings = getSavings(range.startYear, range.endYear);
      const savingsText = savings ? range.period > 2 ? `₹${savings}-${savings + 15}L (${range.period} yr)` : `₹${savings}-${savings + 2}L` : 'N/A';

      progression.push({
        years: range.years,
        position: position.replace(/^\d+\.\s*/, ''),
        salaryRange: `${stageSalary}-${nextStageSalary} LPA`,
        keyRequirement,
        estimatedSavings: savingsText,
      });
    });

    return progression;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 60 }}>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.ink, letterSpacing: '-0.03em', marginBottom: 8 }}>Your Career Recommendations</h1>
        <p style={{ fontSize: 16, color: C.ink3, fontWeight: 500 }}>AI-powered insights based on your profile</p>
      </div>

      {top_career_paths.map((career, idx) => {
        const financialProj = financial_projections.find(p => p.career_path.toLowerCase().includes(career.title.toLowerCase()) || career.title.toLowerCase().includes(p.career_path.toLowerCase()));
        const progression = parseCareerProgression(career, financialProj);
        
        return (
          <section key={`progression-${idx}`}>
            <SectionHead title={`${career.title} Timeline`} subtitle="Career Progression" />
            <Card pad={0} style={{ overflow: 'hidden', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: C.saffronLt }}>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Age</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Position / Title</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Salary Range</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Key Requirement</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est. Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {progression.map((stage, stageIdx) => (
                    <tr key={stageIdx} style={{ borderTop: `1px solid ${C.line}`, background: stageIdx % 2 === 0 ? '#fff' : C.bgDeep }}>
                      <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, color: C.ink }}>{stage.years}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13.5, color: C.ink }}>{stage.position}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, color: C.ink2 }}>{stage.salaryRange}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13.5, color: C.ink3 }}>{stage.keyRequirement}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13.5, color: C.ink2, fontWeight: 500 }}>{stage.estimatedSavings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        );
      })}

      <section>
        <SectionHead title="Career Overview" subtitle="Detailed look at top paths" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {top_career_paths.map((career, idx) => (
            <Card key={idx} pad={24}>
              <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 8, letterSpacing: '-0.02em' }}>{career.title}</h3>
              <p style={{ fontSize: 13.5, color: C.ink3, fontWeight: 500, lineHeight: 1.5, marginBottom: 16 }}>{career.description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, background: C.bgDeep, padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, fontWeight: 600 }}><DollarSign size={14} color={C.green} /> <span><strong>Salary:</strong> {career.salary_range}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, fontWeight: 600 }}><TrendingUp size={14} color={C.saffronDk} /> <span><strong>Growth:</strong> {career.growth_prospects}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, fontWeight: 600 }}><Shield size={14} color={C.brick} /> <span><strong>Risk:</strong> {career.risk_level}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, fontWeight: 600 }}><Clock size={14} color="#6B4E8B" /> <span><strong>Timeline:</strong> {career.timeline}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, fontWeight: 600 }}><MapPin size={14} color="#A33B2A" /> <span><strong>Location:</strong> {career.location_flexibility}</span></div>
              </div>

              <div style={{ borderTop: `1px dashed ${C.lineMid}`, paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pros</div>
                <ul style={{ paddingLeft: 16, margin: '0 0 16px 0', fontSize: 13, color: C.ink3, fontWeight: 500, lineHeight: 1.4 }}>
                  {career.pros.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
                </ul>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.brick, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cons</div>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: C.ink3, fontWeight: 500, lineHeight: 1.4 }}>
                  {career.cons.map((c, i) => <li key={i} style={{ marginBottom: 4 }}>{c}</li>)}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {salaryData.length > 0 && (
        <section>
          <SectionHead title="Salary Range Comparison" subtitle="Comparing the top paths" />
          <Card pad={24}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.lineMid} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.lineMid }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.lineMid }} tickLine={false} />
                <Tooltip cursor={{ fill: C.bgDeep }} contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                <Bar dataKey="min" fill={C.saffron} name="Min Salary (LPA)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill={C.green} name="Max Salary (LPA)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </section>
      )}

      {financial_projections.map((proj, idx) => {
        const chartData = prepareWealthProjectionData(proj);
        const careerTitle = proj.career_path || top_career_paths[idx]?.title || 'Career Path';
        
        return (
          <section key={`wealth-projection-${idx}`}>
            <SectionHead title={`20-Year Career & Wealth Projection`} subtitle={`${careerTitle} (India Market, Estimated Growth)`} />
            <Card pad={24}>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.lineMid} />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.lineMid }} tickLine={false} />
                  <YAxis yAxisId="left" label={{ value: 'Annual Salary (₹ LPA)', angle: -90, position: 'insideLeft', fill: C.ink3, fontSize: 12 }} domain={[0, 'dataMax + 10']} tick={{ fontSize: 11, fill: C.ink3 }} axisLine={{ stroke: C.lineMid }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Savings & Net Worth (₹ Lakhs)', angle: 90, position: 'insideRight', fill: C.ink3, fontSize: 12 }} domain={[0, 'dataMax + 50']} tick={{ fontSize: 11, fill: C.ink3 }} axisLine={{ stroke: C.lineMid }} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: C.bgDeep, opacity: 0.5 }}
                    contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: 13 }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Annual Salary') return [`₹${value.toFixed(1)} LPA`, name];
                      if (name === 'Net Worth' || name === 'Cumulative Savings') {
                        if (value >= 100) return [`₹${(value / 100).toFixed(1)} Cr`, name];
                        return [`₹${value.toFixed(1)} Lakhs`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                  <Area yAxisId="right" type="monotone" dataKey="cumulativeSavings" fill={`${C.green}30`} stroke={C.green} strokeWidth={2} name="Cumulative Savings" />
                  <Line yAxisId="left" type="monotone" dataKey="annualSalary" stroke={C.saffronDk} strokeWidth={3} dot={{ fill: C.saffronDk, r: 5 }} name="Annual Salary" />
                  <Line yAxisId="right" type="monotone" dataKey="netWorth" stroke={C.brick} strokeWidth={3} dot={{ fill: C.brick, r: 5 }} name="Net Worth" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </section>
        );
      })}

      {next_steps && next_steps.length > 0 && (
        <section>
          <SectionHead title="Next Steps" subtitle="Actionable items to get started" />
          <Card pad={24} style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFEFD3 100%)', borderColor: 'rgba(184, 137, 60, 0.18)' }}>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {next_steps.map((step, idx) => (
                <li key={idx} style={{ fontSize: 15, color: C.ink, fontWeight: 500, lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      {recommendations.retrieved_context && recommendations.retrieved_context.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 13, color: C.ink4, fontWeight: 500 }}>
          Powered by RAG System: Analyzed {recommendations.retrieved_context.length} relevant career profiles from our knowledge base.
        </div>
      )}
    </div>
  );
}
