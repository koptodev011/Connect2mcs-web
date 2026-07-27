'use client';

import { useState, useEffect } from 'react';
import { UserResponse, EducationLevel, Stream, Specialization, Location, CareerDirection, PreferredCareerDomain, WorkingProfessionalCareerPath, SettlementPreference, MarriageAge, FamilyImportance, SpouseCareerPreference, ExpectedKids, FatherProfession, FinancialBackground, RiskTolerance, ShortTermGoals, LongTermGoals, HigherEducationPreference, CareerOutcome } from '@/types/career-simulator';
import { getAvailableStreams, getSpecializationOptions, getWorkingProfessionalOptions, INTERESTS_OPTIONS } from '@/lib/career-helpers';
import { Btn, Card } from '@/components/primitives';
import { C, F } from '@/lib/tokens';

interface QuestionnaireProps {
  onSubmit: (data: UserResponse) => void;
}

export default function Questionnaire({ onSubmit }: QuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserResponse>>({
    interests: [],
    career_outcomes: [],
  });
  const [birthDate, setBirthDate] = useState<string>('');

  const totalSteps = 12;

  const updateField = <K extends keyof UserResponse>(field: K, value: UserResponse[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (birthDateStr: string): number | null => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 15 && age <= 100 ? age : null;
  };

  useEffect(() => {
    if (birthDate) {
      const calculatedAge = calculateAge(birthDate);
      if (calculatedAge !== null) {
        setFormData(prev => ({ ...prev, age: calculatedAge, birth_date: birthDate }));
      } else {
        setFormData(prev => ({ ...prev, age: undefined as any }));
      }
    } else {
      setFormData(prev => ({ ...prev, age: undefined as any, birth_date: undefined }));
    }
  }, [birthDate]);

  useEffect(() => {
    if (formData.education_level) {
      const availableStreams = getAvailableStreams(formData.education_level);
      if (formData.stream && !availableStreams.includes(formData.stream)) {
        updateField('stream', undefined as any);
      }
    }
  }, [formData.education_level]);

  const handleNext = () => {
    if (step === 1 && formData.education_level === 'Other' && !formData.custom_education_level?.trim()) return;
    if (step === 2) {
      const isWorkingProfessional = formData.education_level?.includes('Working Professional');
      const isOther = formData.education_level === 'Other';
      if (!isOther) {
        if (isWorkingProfessional && !formData.working_professional_career_path) return;
        if (!isWorkingProfessional) {
          const specOptions = getSpecializationOptions(formData.stream);
          if (specOptions.length > 0 && !formData.specialization) return;
        }
      }
    }
    if (step === 3 && formData.career_direction === 'Job' && !formData.preferred_career_domain) return;
    
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (formData.interests && formData.interests.length >= 1 &&
        formData.career_outcomes && formData.career_outcomes.length >= 1 &&
        formData.age && formData.age >= 15 && formData.age <= 100) {
      onSubmit({ ...formData, birth_date: birthDate || formData.birth_date, age: formData.age } as UserResponse);
    }
  };

  const toggleArrayField = (field: 'interests' | 'career_outcomes', value: string) => {
    const current = formData[field] || [];
    const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
    updateField(field, updated as any);
  };

  const FieldWrapper = ({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: desc ? 4 : 10 }}>{label}</div>
      {desc && <div style={{ fontSize: 13.5, color: C.ink3, marginBottom: 10, fontWeight: 500 }}>{desc}</div>}
      {children}
    </div>
  );

  const SharedInputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.lineMid}`, fontSize: 15, fontFamily: F.ui, outline: 'none', background: '#fff' };
  const CheckboxStyle = { padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', fontSize: 14, fontWeight: 500 };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Basic Information</h2>
            <FieldWrapper label="Date of Birth" desc="Your age affects career suggestions and timelines.">
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                style={SharedInputStyle} required />
              {formData.age && <div style={{ marginTop: 8, fontSize: 13, color: C.green, fontWeight: 600 }}>Calculated age: {formData.age} years</div>}
            </FieldWrapper>

            <FieldWrapper label="Education Level">
              <select value={formData.education_level || ''} onChange={(e) => {
                updateField('education_level', e.target.value as EducationLevel);
                if (e.target.value !== 'Other') updateField('custom_education_level', undefined);
              }} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(EducationLevel).map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </FieldWrapper>

            {formData.education_level === 'Other' && (
              <FieldWrapper label="Describe Your Education Level / Career Path" desc="AI will analyze your description and suggest appropriate career paths.">
                <textarea value={formData.custom_education_level || ''} onChange={(e) => updateField('custom_education_level', e.target.value)}
                  placeholder="e.g., 'Completed 3-year diploma in Electronics'"
                  style={{ ...SharedInputStyle, minHeight: 100, resize: 'vertical' }} required />
              </FieldWrapper>
            )}
          </div>
        );

      case 2:
        const availableStreams = getAvailableStreams(formData.education_level);
        const specializationOptions = getSpecializationOptions(formData.stream);
        const needsSpecialization = specializationOptions.length > 0;
        const isWorkingProfessional = formData.education_level?.includes('Working Professional');
        const isOther = formData.education_level === 'Other';
        const workingProfessionalOptions = isWorkingProfessional ? getWorkingProfessionalOptions() : [];
        
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>
              {isWorkingProfessional ? 'Career Path Selection' : 'Domain & Specialization'}
            </h2>
            
            {!formData.education_level && <div style={{ color: C.brick, marginBottom: 16, fontWeight: 600 }}>⚠️ Please select your Education Level in Step 1.</div>}

            {isWorkingProfessional ? (
              <FieldWrapper label="Select Your Preferred Career Path">
                {workingProfessionalOptions.map((category, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{category.category}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {category.options.map((path) => (
                        <label key={path} style={{ ...CheckboxStyle, background: formData.working_professional_career_path === path ? C.saffronLt : '#fff', borderColor: formData.working_professional_career_path === path ? C.saffron : C.lineMid }}>
                          <input type="radio" name="working_professional_career_path" value={path} checked={formData.working_professional_career_path === path} onChange={(e) => updateField('working_professional_career_path', e.target.value as WorkingProfessionalCareerPath)} style={{ width: 16, height: 16 }} />
                          {path}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </FieldWrapper>
            ) : isOther ? (
              <FieldWrapper label="Stream/Domain (Optional)" desc="You can select a stream if you know it, or skip and let AI analyze your custom description.">
                <select value={formData.stream || ''} onChange={(e) => { updateField('stream', e.target.value as Stream); updateField('specialization', undefined); }} style={SharedInputStyle} disabled={!formData.education_level}>
                  <option value="">Skip - Let AI analyze</option>
                  {availableStreams.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldWrapper>
            ) : (
              <>
                <FieldWrapper label={formData.education_level?.includes('10th') ? 'What do you want to pursue after 10th?' : formData.education_level?.includes('12th') ? 'What did you study in 12th?' : 'Stream/Domain'}>
                  <select value={formData.stream || ''} onChange={(e) => { updateField('stream', e.target.value as Stream); updateField('specialization', undefined); }} style={SharedInputStyle} required disabled={!formData.education_level}>
                    <option value="">Select...</option>
                    {availableStreams.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldWrapper>

                {needsSpecialization && formData.stream && (
                  <FieldWrapper label="Select Specialization / Course">
                    {specializationOptions.map((category, idx) => (
                      <div key={idx} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{category.category}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {category.options.map((spec) => (
                            <label key={spec} style={{ ...CheckboxStyle, background: formData.specialization === spec ? C.saffronLt : '#fff', borderColor: formData.specialization === spec ? C.saffron : C.lineMid }}>
                              <input type="radio" name="specialization" value={spec} checked={formData.specialization === spec} onChange={(e) => updateField('specialization', e.target.value as Specialization)} style={{ width: 16, height: 16 }} />
                              {spec}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </FieldWrapper>
                )}
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Career Direction</h2>
            <FieldWrapper label="Preferred Career Direction">
              <select value={formData.career_direction || ''} onChange={(e) => { updateField('career_direction', e.target.value as CareerDirection); if (e.target.value !== 'Job') updateField('preferred_career_domain', undefined); }} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(CareerDirection).map(dir => <option key={dir} value={dir}>{dir}</option>)}
              </select>
            </FieldWrapper>

            {formData.career_direction === 'Job' && (
              <FieldWrapper label="Preferred Career Domain" desc="Select the domain you're most interested in for your job career">
                <select value={formData.preferred_career_domain || ''} onChange={(e) => updateField('preferred_career_domain', e.target.value as PreferredCareerDomain)} style={SharedInputStyle} required>
                  <option value="">Select...</option>
                  {Object.values(PreferredCareerDomain).map(domain => <option key={domain} value={domain}>{domain}</option>)}
                </select>
              </FieldWrapper>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Location & Exposure</h2>
            <FieldWrapper label="Where have you grown up?">
              <select value={formData.location || ''} onChange={(e) => updateField('location', e.target.value as Location)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Interests & Industries</h2>
            <FieldWrapper label="Select your preferred interests" desc="You can choose multiple options.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {INTERESTS_OPTIONS.map(interest => (
                  <label key={interest} style={{ ...CheckboxStyle, background: formData.interests?.includes(interest) ? C.saffronLt : '#fff', borderColor: formData.interests?.includes(interest) ? C.saffron : C.lineMid }}>
                    <input type="checkbox" checked={formData.interests?.includes(interest)} onChange={() => toggleArrayField('interests', interest)} style={{ width: 16, height: 16 }} />
                    {interest}
                  </label>
                ))}
              </div>
            </FieldWrapper>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Future Settlement</h2>
            <FieldWrapper label="Where do you see yourself settling?">
              <select value={formData.settlement_preference || ''} onChange={(e) => updateField('settlement_preference', e.target.value as SettlementPreference)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(SettlementPreference).map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Marriage Plans</h2>
            <FieldWrapper label="Expected Marriage Age">
              <select value={formData.marriage_age || ''} onChange={(e) => updateField('marriage_age', e.target.value as MarriageAge)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(MarriageAge).map(age => <option key={age} value={age}>{age}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 8:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Family Considerations</h2>
            <FieldWrapper label="Family Importance in Career Decisions">
              <select value={formData.family_importance || ''} onChange={(e) => updateField('family_importance', e.target.value as FamilyImportance)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(FamilyImportance).map(imp => <option key={imp} value={imp}>{imp}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Spouse Career Preference (Optional)">
              <select value={formData.spouse_career_preference || ''} onChange={(e) => updateField('spouse_career_preference', e.target.value as SpouseCareerPreference)} style={SharedInputStyle}>
                <option value="">Select...</option>
                {Object.values(SpouseCareerPreference).map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="How many kids you are expecting (Optional)">
              <select value={formData.expected_kids || ''} onChange={(e) => updateField('expected_kids', e.target.value as ExpectedKids)} style={SharedInputStyle}>
                <option value="">Select...</option>
                {Object.values(ExpectedKids).map(kids => <option key={kids} value={kids}>{kids}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 9:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Financial Background</h2>
            <FieldWrapper label="Father's Profession (Optional)">
              <select value={formData.father_profession || ''} onChange={(e) => updateField('father_profession', e.target.value as FatherProfession)} style={SharedInputStyle}>
                <option value="">Select...</option>
                {Object.values(FatherProfession).map(prof => <option key={prof} value={prof}>{prof}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Family Financial Background">
              <select value={formData.financial_background || ''} onChange={(e) => updateField('financial_background', e.target.value as FinancialBackground)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(FinancialBackground).map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Risk Tolerance">
              <select value={formData.risk_tolerance || ''} onChange={(e) => updateField('risk_tolerance', e.target.value as RiskTolerance)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(RiskTolerance).map(risk => <option key={risk} value={risk}>{risk}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 10:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Financial Goals</h2>
            <FieldWrapper label="Short Term Goals (Optional)">
              <select value={formData.short_term_goals || ''} onChange={(e) => updateField('short_term_goals', e.target.value as ShortTermGoals)} style={SharedInputStyle}>
                <option value="">Select...</option>
                {Object.values(ShortTermGoals).map(goal => <option key={goal} value={goal}>{goal}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Long Term Goals (Optional)">
              <select value={formData.long_term_goals || ''} onChange={(e) => updateField('long_term_goals', e.target.value as LongTermGoals)} style={SharedInputStyle}>
                <option value="">Select...</option>
                {Object.values(LongTermGoals).map(goal => <option key={goal} value={goal}>{goal}</option>)}
              </select>
            </FieldWrapper>
          </div>
        );

      case 11:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Education & Career Outcomes</h2>
            <FieldWrapper label="Higher Education (location) Preference">
              <select value={formData.higher_education_preference || ''} onChange={(e) => updateField('higher_education_preference', e.target.value as HigherEducationPreference)} style={SharedInputStyle} required>
                <option value="">Select...</option>
                {Object.values(HigherEducationPreference).map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Career Outcome Priorities (Select up to 2)">
              <div style={{ display: 'grid', gap: 10 }}>
                {Object.values(CareerOutcome).map(outcome => {
                  const isDisabled = formData.career_outcomes && formData.career_outcomes.length >= 2 && !formData.career_outcomes.includes(outcome);
                  return (
                    <label key={outcome} style={{ ...CheckboxStyle, background: formData.career_outcomes?.includes(outcome) ? C.saffronLt : isDisabled ? '#f8f8f8' : '#fff', borderColor: formData.career_outcomes?.includes(outcome) ? C.saffron : C.lineMid, opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                      <input type="checkbox" checked={formData.career_outcomes?.includes(outcome)} onChange={() => toggleArrayField('career_outcomes', outcome)} disabled={isDisabled} style={{ width: 16, height: 16 }} />
                      {outcome}
                    </label>
                  );
                })}
              </div>
            </FieldWrapper>
          </div>
        );

      case 12:
        return (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 24, letterSpacing: '-0.02em' }}>Review & Submit</h2>
            <div style={{ background: C.surface, padding: 20, borderRadius: 12, border: `1px solid ${C.lineMid}`, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Date of Birth:</strong> {birthDate || 'Not provided'}</div>
              <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Age:</strong> {formData.age ? `${formData.age} years` : 'Not calculated'}</div>
              <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Education:</strong> {formData.education_level}</div>
              {formData.custom_education_level && <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Custom Education Description:</strong> {formData.custom_education_level}</div>}
              {formData.stream && <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Stream:</strong> {formData.stream}</div>}
              {formData.specialization && <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Specialization:</strong> {formData.specialization}</div>}
              {formData.working_professional_career_path && <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Career Path:</strong> {formData.working_professional_career_path}</div>}
              <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Interests:</strong> {formData.interests?.join(', ')}</div>
              <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Career Direction:</strong> {formData.career_direction}</div>
              {formData.career_direction === 'Job' && formData.preferred_career_domain && <div style={{ fontSize: 14, color: C.ink }}><strong style={{ color: C.ink2 }}>Preferred Domain:</strong> {formData.preferred_career_domain}</div>}
            </div>
            <Btn kind="primary" size="lg" full onClick={handleSubmit} style={{ opacity: (!formData.age || formData.age < 15 || formData.age > 100) ? 0.5 : 1, cursor: (!formData.age || formData.age < 15 || formData.age > 100) ? 'not-allowed' : 'pointer' }}>
              Get Career Recommendations
            </Btn>
            {(!formData.age || formData.age < 15 || formData.age > 100) && <div style={{ marginTop: 12, color: C.brick, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>Please provide a valid date of birth (age must be between 15-100 years)</div>}
          </div>
        );

      default:
        return null;
    }
  };

  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.saffronDk, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: C.lineMid, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercentage}%`, height: '100%', background: C.saffron, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <Card pad={36}>
        {renderStep()}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Btn kind="subtle" size="md" onClick={handlePrevious} style={{ opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
          Previous
        </Btn>
        {step < totalSteps && (
          <Btn kind="primary" size="md" onClick={handleNext}>
            Next
          </Btn>
        )}
      </div>
    </div>
  );
}
