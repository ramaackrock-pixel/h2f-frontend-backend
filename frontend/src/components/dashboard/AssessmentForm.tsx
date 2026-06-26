import React, { useState } from 'react';
import { AnatomyMap } from './AnatomyMap';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Activity,
  Target,
  User,
  Home,
  Accessibility,
  Move,
  BookOpen,
  ClipboardList
} from 'lucide-react';

interface AssessmentFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function AssessmentForm({ initialData, onSave, onCancel }: AssessmentFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: General Info & Living Conditions
    general: {
      patientName: initialData?.name || '',
      fatherName: '',
      registrationNumber: initialData?.pid || '',
      address: initialData?.address || '',
      phoneNumber: initialData?.contact || '',
      age: initialData?.demographics?.match(/\d+/)?.[0] || '',
      gender: initialData?.demographics?.toUpperCase().includes('F') ? 'F' : 'M',
      diagnosis: '',
      civilStatus: 'Single',
      children: '0',
      occupation: initialData?.occupation || '',
      educationLevel: initialData?.occupation || '',
      canWrite: 'Yes',
      canRead: 'Yes',
      class: ''
    },
    living: {
      houseCondition: 'Good',
      environment: 'Urban',
      family: 'Present',
      friends: 'Present',
      culturalEnvironment: 'Supportive'
    },

    // Step 2: History, Social Support & Goals
    history: {
      historyOfTrauma: '',
      date: '',
      circumstances: '',
      associatedDiseases: '',
      medicalHistory: '',
      hospital: '',
      care: '',
      evolution: 'Improved',
      remarks: '',
      medication: '',
      xrayOrExams: ''
    },
    support: {
      medicalAccess: 'Yes',
      socialAccess: 'Yes',
      securitySituation: 'Good'
    },
    goals: {
      mainConcerns: '',
      expectations: '',
      currentTreatment: '',
      date: '',
      physioName: ''
    },

    // Step 3: Psychological Status
    psychological: {
      motivation: 'Good',
      attitude: 'Good',
      cognitiveStatus: '',
      concentration: '',
      communication: '',
      bowelControl: 'Yes',
      swallowing: 'Good',
      breathing: '',
      vision: '',
      hearing: ''
    },

    // Step 4: Physical Exam & Neurodynamics
    physical: {
      remarks: '',
      skinCondition: '',
      sensation: '',
      reflexes: '',
      swelling: '',
      callus: '',
      scar: '',
      wound: '',
      temperature: '',
      infection: '',
      pain: '',
      abnormalSensation: '',
      sensitivityRight: '',
      sensitivityLeft: '',
      superficial: '',
      deep: '',
      numbness: '',
      paresthesia: '',
      other: '',
      painPoints: [] as string[], // AnatomyMap state
      painCategory: '',
      slr: '',
      slump: '',
      pkb: '',
      ulnt: '',
      dateFirstComplaint: '',
      painEvolution: '',
      painScale: 0,
      painIncreaseFactors: '',
      painDecreaseFactors: ''
    },

    // Step 5: ROM & Muscle Test
    rom: {
      upperLimb: '',
      shoulder: '',
      elbow: '',
      forearm: '',
      wrist: '',
      fingers: '',
      lowerLimb: '',
      hip: '',
      knee: '',
      ankleFoot: '',
      neckMovements: '',
      trunkMovements: ''
    },
    muscleTest: {
      upperLimb: '',
      lowerLimb: '',
      comments: '',
      oxfordScale: '5'
    },
    muscleTone: {
      modifiedAshworth: '0',
      hypotoneOption: ''
    },

    // Step 6: Functional & Activity Limits
    functional: {
      balance: '',
      coordination: '',
      gaitAnalysis: '',
      frontalPlane: '',
      sagittalPlane: '',
      gaitQuality: 'Normal',
      safety: '',
      cadence: '',
      speed: '',
      fatigue: '',
      upperLimbFunction: 'Good',
      lowerLimbFunction: '',
      sitting: 'Normal',
      standing: ''
    },
    activity: {
      assistiveDevices: 'None',
      crutch: '',
      walkingFrame: '',
      wheelchair: '',
      orthosesRight: '',
      orthosesLeft: '',
      activitiesStatus: 'Independent',
      mobility: '',
      transfers: '',
      balanceActivities: '',
      upperLimbFunctions: '',
      dailyActivities: ''
    },

    // Step 7: Conclusion, Referral & Plan
    conclusion: {
      environmentalFactors: '',
      personalConditions: '',
      livingConditions: '',
      medicalSocial: '',
      currentTreatment: '',
      remarks: '',
      traumaDiseases: '',
      romStatus: '',
      muscleStatus: '',
      skinPain: '',
      cardiovascular: '',
      activityLimitations: '',
      mobility: '',
      transfers: '',
      balance: '',
      upperLimb: '',
      dailyActivities: ''
    },
    referral: {
      medicalCare: '',
      medication: '',
      orthopaedic: '',
      nursingCare: '',
      removeCast: '',
      stumpRevision: '',
      tenotomy: '',
      other: ''
    },
    plan: {
      walkingAids: '',
      wheelchairs: '',
      prostheses: '',
      orthoses: '',
      technicalSpecs: '',
      shortTermGoals: '',
      midTermGoals: '',
      longTermGoals: '',
      treatmentProposals: '',
      followUpPlan: '',
      nextAppointment: ''
    }
  });

  const steps = [
    { id: 1, name: 'General & Living', icon: <User size={18} /> },
    { id: 2, name: 'History & Goals', icon: <BookOpen size={18} /> },
    { id: 3, name: 'Psychological', icon: <Target size={18} /> },
    { id: 4, name: 'Physical & Pain', icon: <Activity size={18} /> },
    { id: 5, name: 'ROM & Muscle', icon: <Accessibility size={18} /> },
    { id: 6, name: 'Functional Eval', icon: <Move size={18} /> },
    { id: 7, name: 'Conclusion & Plan', icon: <ClipboardList size={18} /> },
  ];

  const handleUpdate = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <User className="text-[#5ab2b2]" />
                Patient General Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'patientName', label: 'Patient Name' },
                  { id: 'fatherName', label: "Father's Name" },
                  { id: 'registrationNumber', label: 'Registration Number' },
                  { id: 'address', label: 'Address' },
                  { id: 'phoneNumber', label: 'Phone Number' },
                  { id: 'age', label: 'Age' },
                  { id: 'diagnosis', label: 'Diagnosis' },
                  { id: 'occupation', label: 'Job & Occupation' },
                  { id: 'educationLevel', label: 'Education Level' },
                  { id: 'class', label: 'Class' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <input
                      type="text"
                      value={(formData.general as any)[field.id]}
                      onChange={(e) => handleUpdate('general', field.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5ab2b2]/10 outline-none"
                    />
                  </div>
                ))}

                {/* Selects */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Gender</label>
                  <select value={formData.general.gender} onChange={(e) => handleUpdate('general', 'gender', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                    <option>F</option>
                    <option>M</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Civil Status</label>
                  <select value={formData.general.civilStatus} onChange={(e) => handleUpdate('general', 'civilStatus', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                    <option>Single</option>
                    <option>Married</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Can Write/Read</label>
                  <div className="flex gap-2">
                    <select value={formData.general.canWrite} onChange={(e) => handleUpdate('general', 'canWrite', e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                      <option value="Yes">Write: Yes</option><option value="No">Write: No</option>
                    </select>
                    <select value={formData.general.canRead} onChange={(e) => handleUpdate('general', 'canRead', e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                      <option value="Yes">Read: Yes</option><option value="No">Read: No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Home className="text-[#5ab2b2]" />
                Living Conditions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'houseCondition', label: 'House Condition', opts: ['Good', 'Bad'] },
                  { id: 'environment', label: 'Environment', opts: ['Rural', 'Urban', 'Mountain', 'Flooded'] },
                  { id: 'family', label: 'Family', opts: ['Present', 'Absent'] },
                  { id: 'friends', label: 'Friends', opts: ['Present', 'Absent'] },
                  { id: 'culturalEnvironment', label: 'Cultural', opts: ['Supportive', 'Limitative'] },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <select value={(formData.living as any)[field.id]} onChange={(e) => handleUpdate('living', field.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                      {field.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <BookOpen className="text-[#5ab2b2]" />
                Patient History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'historyOfTrauma', label: 'History of Trauma/Illness' },
                  { id: 'circumstances', label: 'Circumstances / Etiology' },
                  { id: 'associatedDiseases', label: 'Associated Diseases' },
                  { id: 'medicalHistory', label: 'Medical History / Treatment' },
                  { id: 'hospital', label: 'Hospital' },
                  { id: 'care', label: 'Care' },
                  { id: 'remarks', label: 'Remarks' },
                  { id: 'medication', label: 'Medication' },
                  { id: 'xrayOrExams', label: 'X-ray / Other Exams' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <textarea
                      value={(formData.history as any)[field.id]}
                      onChange={(e) => handleUpdate('history', field.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5ab2b2]/10 outline-none"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Medical & Social Support</h3>
                <div className="space-y-4">
                  {[
                    { id: 'medicalAccess', label: 'Access to Medical Services', opts: ['Yes', 'No'] },
                    { id: 'socialAccess', label: 'Access to Social Services', opts: ['Yes', 'No'] },
                    { id: 'securitySituation', label: 'Security Situation', opts: ['Good', 'Bad'] },
                  ].map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                      <select value={(formData.support as any)[field.id]} onChange={(e) => handleUpdate('support', field.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                        {field.opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Patient Goals</h3>
                <div className="space-y-4">
                  {[
                    { id: 'mainConcerns', label: 'Main Concerns' },
                    { id: 'expectations', label: 'Expectations' },
                    { id: 'currentTreatment', label: 'Current Treatment (1st/2nd/3rd)' },
                    { id: 'physioName', label: 'Physio Name' },
                  ].map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                      <input
                        type="text"
                        value={(formData.goals as any)[field.id]}
                        onChange={(e) => handleUpdate('goals', field.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Target className="text-[#5ab2b2]" />
                Psychological Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'motivation', label: 'Motivation / Emotional Status' },
                  { id: 'attitude', label: 'Attitude / Compliance' },
                  { id: 'swallowing', label: 'Swallowing' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <select value={(formData.psychological as any)[field.id]} onChange={(e) => handleUpdate('psychological', field.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                      <option>Good</option><option>Bad</option>
                    </select>
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Bowel / Bladder control</label>
                  <select value={formData.psychological.bowelControl} onChange={(e) => handleUpdate('psychological', 'bowelControl', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                    <option>Yes</option><option>No</option>
                  </select>
                </div>

                {[
                  { id: 'cognitiveStatus', label: 'Cognitive Status' },
                  { id: 'concentration', label: 'Concentration / Memory' },
                  { id: 'communication', label: 'Communication' },
                  { id: 'breathing', label: 'Breathing' },
                  { id: 'vision', label: 'Vision' },
                  { id: 'hearing', label: 'Hearing' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <input
                      type="text"
                      value={(formData.psychological as any)[field.id]}
                      onChange={(e) => handleUpdate('psychological', field.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* ANATOMY MAP IS PRESERVED HERE */}
            <AnatomyMap
              selectedParts={formData.physical.painPoints}
              onChange={(parts) => handleUpdate('physical', 'painPoints', parts)}
            />

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Activity className="text-[#5ab2b2]" />
                Physical Examination & Pain
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { id: 'swelling', label: 'Swelling' },
                  { id: 'callus', label: 'Callus' },
                  { id: 'scar', label: 'Scar' },
                  { id: 'wound', label: 'Wound' },
                  { id: 'temperature', label: 'Temperature' },
                  { id: 'infection', label: 'Infection' },
                  { id: 'sensation', label: 'Sensation' },
                  { id: 'reflexes', label: 'Reflexes' },
                ].map(field => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                    <input
                      type="text"
                      value={(formData.physical as any)[field.id]}
                      onChange={(e) => handleUpdate('physical', field.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Neurodynamic Tests</h4>
                  {['slr', 'slump', 'pkb', 'ulnt'].map(test => (
                    <div key={test}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{test}</label>
                      <input type="text" value={(formData.physical as any)[test]} onChange={(e) => handleUpdate('physical', test, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Pain Profile</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Patient Category (SIN, ROM, MOMP, EOR)</label>
                      <input type="text" value={formData.physical.painCategory} onChange={(e) => handleUpdate('physical', 'painCategory', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Pain Scale (0-10)</label>
                      <select value={formData.physical.painScale} onChange={(e) => handleUpdate('physical', 'painScale', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-[#5ab2b2]">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Pain Increase Factors</label>
                      <input type="text" value={formData.physical.painIncreaseFactors} onChange={(e) => handleUpdate('physical', 'painIncreaseFactors', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Pain Decrease Factors</label>
                      <input type="text" value={formData.physical.painDecreaseFactors} onChange={(e) => handleUpdate('physical', 'painDecreaseFactors', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Accessibility className="text-[#5ab2b2]" />
                Range of Motion (ROM) & Muscle Tests
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">ROM - Upper Limb</h4>
                  {['shoulder', 'elbow', 'forearm', 'wrist', 'fingers'].map(field => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{field}</label>
                      <input type="text" value={(formData.rom as any)[field]} onChange={(e) => handleUpdate('rom', field, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">ROM - Lower Limb</h4>
                  {['hip', 'knee', 'ankleFoot', 'neckMovements', 'trunkMovements'].map(field => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{field}</label>
                      <input type="text" value={(formData.rom as any)[field]} onChange={(e) => handleUpdate('rom', field, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Muscle Test</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Oxford Scale (0-5)</label>
                    <select value={formData.muscleTest.oxfordScale} onChange={(e) => handleUpdate('muscleTest', 'oxfordScale', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-[#5ab2b2] outline-none">
                      {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Comments (Flexors, Extensors, etc)</label>
                    <textarea value={formData.muscleTest.comments} onChange={(e) => handleUpdate('muscleTest', 'comments', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Muscle Tone</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Modified Ashworth Scale (0-4)</label>
                    <select value={formData.muscleTone.modifiedAshworth} onChange={(e) => handleUpdate('muscleTone', 'modifiedAshworth', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-[#5ab2b2] outline-none">
                      {['0', '1', '1+', '2', '3', '4'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hypotone Option</label>
                    <input type="text" value={formData.muscleTone.hypotoneOption} onChange={(e) => handleUpdate('muscleTone', 'hypotoneOption', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Move className="text-[#5ab2b2]" />
                Functional Evaluation & Limitations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-50 pb-2">Functional Eval</h4>
                  {[
                    { id: 'balance', label: 'Balance' },
                    { id: 'coordination', label: 'Coordination' },
                    { id: 'gaitAnalysis', label: 'Gait Analysis' },
                    { id: 'frontalPlane', label: 'Frontal plane' },
                    { id: 'sagittalPlane', label: 'Sagittal plane' },
                    { id: 'safety', label: 'Safety' },
                    { id: 'cadence', label: 'Cadence' },
                    { id: 'speed', label: 'Speed' },
                    { id: 'fatigue', label: 'Fatigue' },
                  ].map(field => (
                    <div key={field.id}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{field.label}</label>
                      <input type="text" value={(formData.functional as any)[field.id]} onChange={(e) => handleUpdate('functional', field.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gait Quality</label>
                    <select value={formData.functional.gaitQuality} onChange={(e) => handleUpdate('functional', 'gaitQuality', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none">
                      <option>Normal</option><option>Good</option><option>Poor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-50 pb-2">Activity Limitations</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Assistive Devices</label>
                    <select value={formData.activity.assistiveDevices} onChange={(e) => handleUpdate('activity', 'assistiveDevices', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none">
                      <option>None</option><option>Crutch</option><option>Walking frame</option><option>Wheelchair</option>
                    </select>
                  </div>
                  {[
                    { id: 'orthosesRight', label: 'Orthoses (Right)' },
                    { id: 'orthosesLeft', label: 'Orthoses (Left)' },
                    { id: 'mobility', label: 'Mobility (walking, running, stairs)' },
                    { id: 'transfers', label: 'Transfers' },
                    { id: 'balanceActivities', label: 'Balance' },
                    { id: 'upperLimbFunctions', label: 'Upper Limb Functions' },
                    { id: 'dailyActivities', label: 'Daily Activities (dressing, eating)' },
                  ].map(field => (
                    <div key={field.id}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{field.label}</label>
                      <input type="text" value={(formData.activity as any)[field.id]} onChange={(e) => handleUpdate('activity', field.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <ClipboardList className="text-[#5ab2b2]" />
                Conclusion, Referral & Treatment Plan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase">Conclusion Remarks</h4>
                  <textarea value={formData.conclusion.remarks} onChange={(e) => handleUpdate('conclusion', 'remarks', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={4} placeholder="Environmental & Personal Factors, Body Structure & Function..." />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase">Referral</h4>
                  <textarea value={formData.referral.medicalCare} onChange={(e) => handleUpdate('referral', 'medicalCare', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={4} placeholder="Medical care, Medication, Orthopaedic consultation..." />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-50">
                <h4 className="text-sm font-bold text-slate-700 uppercase">Physiotherapy Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Short-term Goals</label>
                    <textarea value={formData.plan.shortTermGoals} onChange={(e) => handleUpdate('plan', 'shortTermGoals', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mid-term Goals</label>
                    <textarea value={formData.plan.midTermGoals} onChange={(e) => handleUpdate('plan', 'midTermGoals', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Long-term Goals</label>
                    <textarea value={formData.plan.longTermGoals} onChange={(e) => handleUpdate('plan', 'longTermGoals', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Treatment Proposals</label>
                    <textarea value={formData.plan.treatmentProposals} onChange={(e) => handleUpdate('plan', 'treatmentProposals', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Follow-up Plan & Next Appt</label>
                    <textarea value={formData.plan.followUpPlan} onChange={(e) => handleUpdate('plan', 'followUpPlan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" rows={3} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-md relative overflow-x-auto hide-scrollbar">
        <div className="flex space-x-2 w-full min-w-max">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center space-x-2 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${step === s.id ? 'bg-[#5ab2b2] text-white shadow-lg shadow-[#5ab2b2]/40' : step > s.id ? 'bg-teal-50 text-[#5ab2b2]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                onClick={() => setStep(s.id)}
              >
                {s.icon}
                <span className="text-xs font-black uppercase tracking-tighter whitespace-nowrap">{s.name}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {renderStep()}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-40">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-2xl flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-2xl transition-all ${step === 1 ? 'opacity-0 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'}`}
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Discard</button>
            {step === 7 ? (
              <button
                onClick={() => onSave(formData)}
                className="flex items-center space-x-3 px-10 py-3 bg-[#5ab2b2] text-white font-black rounded-2xl shadow-xl shadow-teal-500/30 hover:bg-[#439c9c] active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                <Save size={18} />
                <span>Finalize Assessment</span>
              </button>
            ) : (
              <button
                onClick={() => setStep(s => Math.min(7, s + 1))}
                className="flex items-center space-x-3 px-10 py-3 bg-[#5ab2b2] text-white font-black rounded-2xl shadow-xl shadow-teal-500/30 hover:bg-[#439c9c] active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                <span>Continue</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
