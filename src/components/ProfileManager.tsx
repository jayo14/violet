import React from "react";
import { 
  User, Mail, Phone, MapPin, Github, Linkedin, Globe, 
  BookOpen, Briefcase, Plus, Trash2, CheckCircle2, Bookmark
} from "lucide-react";
import { motion } from "motion/react";
import { UserProfile, Education, Experience } from "../types";

interface ProfileProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export default function ProfileManager({ profile, onUpdateProfile }: ProfileProps) {
  const [profileState, setProfileState] = React.useState<UserProfile>(profile);
  const [skillInput, setSkillInput] = React.useState("");
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setProfileState(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateProfile(profileState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (profileState.skills.includes(skillInput.trim())) return;
    const skills = [...profileState.skills, skillInput.trim()];
    setProfileState(prev => ({ ...prev, skills }));
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    const skills = profileState.skills.filter(s => s !== skill);
    setProfileState(prev => ({ ...prev, skills }));
  };

  const handleAddEducation = () => {
    const edu: Education = {
      school: "New University",
      degree: "B.S.",
      fieldOfStudy: "Computer Science",
      startDate: "2024-09",
      endDate: "2028-06"
    };
    setProfileState(prev => ({
      ...prev,
      education: [...prev.education, edu]
    }));
  };

  const handleAddExperience = () => {
    const exp: Experience = {
      company: "New Company",
      role: "Software Developer",
      location: "San Francisco, CA",
      startDate: "2025-06",
      endDate: "Present",
      description: "Implemented high-performance REST APIs and custom component interfaces."
    };
    setProfileState(prev => ({
      ...prev,
      experience: [...prev.experience, exp]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Save Action Banner */}
      <div className="p-5 bg-white border border-gray-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 animate-pulse">
            <User className="w-5 h-5 text-violet-500" /> Career Profile Architect
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            This represents your master credential source. Violet pulls context parameters from here when adjusting application materials.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {saveSuccess && (
            <span className="text-green-600 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 animate-bounce" /> Telemetry Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="w-full md:w-auto p-2.5 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-102 cursor-pointer"
          >
            💾 Commit Master Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-gray-700">
        {/* Left Col: Master Details & Skills Vector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <User className="w-4.5 h-4.5 text-violet-500" /> Basic Coordinates
            </h3>

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={profileState.fullName} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={profileState.email} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Primary Phone Line</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={profileState.phone || ""} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Current Location / Timezone</label>
                <input 
                  type="text" 
                  name="location" 
                  value={profileState.location || ""} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              <Bookmark className="w-4.5 h-4.5 text-violet-500" /> Digital Portals
            </h3>

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">GitHub URL</label>
                <input 
                  type="text" 
                  name="github" 
                  value={profileState.github || ""} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">LinkedIn Portal</label>
                <input 
                  type="text" 
                  name="linkedin" 
                  value={profileState.linkedin || ""} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-semibold">Personal Portfolio</label>
                <input 
                  type="text" 
                  name="portfolio" 
                  value={profileState.portfolio || ""} 
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Skills list builder */}
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-3">
              ⚔️ Master Skills Vector
            </h3>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input 
                type="text" 
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="React, Docker, Postgres..."
                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
              <button 
                type="submit" 
                className="p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1 bg-gray-50/50 p-3 border rounded-xl min-h-[80px]">
              {profileState.skills.map((skill) => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-150 text-gray-700 font-semibold rounded-lg text-[10px]"
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-gray-400 hover:text-red-500 text-[9px] focus:outline-none font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Education & Software Experiences timelines */}
        <div className="lg:col-span-8 space-y-6">
          {/* Education Blocks */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-violet-500" /> Academic Credentials ({profileState.education.length})
              </h3>
              <button 
                onClick={handleAddEducation}
                className="text-xs text-violet-600 hover:text-violet-750 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Block
              </button>
            </div>

            <div className="space-y-4">
              {profileState.education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-gray-50/50 border rounded-xl grid grid-cols-2 gap-4 font-sans relative group">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">School/College Name</label>
                    <input 
                      type="text" 
                      value={edu.school} 
                      onChange={(e) => {
                        const education = [...profileState.education];
                        education[idx].school = e.target.value;
                        setProfileState(prev => ({ ...prev, education }));
                      }}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Degree & Credentials</label>
                    <input 
                      type="text" 
                      value={edu.degree} 
                      onChange={(e) => {
                        const education = [...profileState.education];
                        education[idx].degree = e.target.value;
                        setProfileState(prev => ({ ...prev, education }));
                      }}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Major Field of Study</label>
                    <input 
                      type="text" 
                      value={edu.fieldOfStudy} 
                      onChange={(e) => {
                        const education = [...profileState.education];
                        education[idx].fieldOfStudy = e.target.value;
                        setProfileState(prev => ({ ...prev, education }));
                      }}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">Graduation Date</label>
                      <input 
                        type="text" 
                        value={edu.endDate} 
                        onChange={(e) => {
                          const education = [...profileState.education];
                          education[idx].endDate = e.target.value;
                          setProfileState(prev => ({ ...prev, education }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">GPA Score</label>
                      <input 
                        type="text" 
                        value={edu.gpa || ""} 
                        onChange={(e) => {
                          const education = [...profileState.education];
                          education[idx].gpa = e.target.value;
                          setProfileState(prev => ({ ...prev, education }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const education = profileState.education.filter((_, i) => i !== idx);
                      setProfileState(prev => ({ ...prev, education }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Professional experience Blocks */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Briefcase className="w-4.5 h-4.5 text-violet-500" /> Career Milestones ({profileState.experience.length})
              </h3>
              <button 
                onClick={handleAddExperience}
                className="text-xs text-violet-600 hover:text-violet-750 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Milestone
              </button>
            </div>

            <div className="space-y-6">
              {profileState.experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-gray-50/50 border rounded-xl space-y-3 relative group font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">Company Name</label>
                      <input 
                        type="text" 
                        value={exp.company} 
                        onChange={(e) => {
                          const experience = [...profileState.experience];
                          experience[idx].company = e.target.value;
                          setProfileState(prev => ({ ...prev, experience }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">Target Role Title</label>
                      <input 
                        type="text" 
                        value={exp.role} 
                        onChange={(e) => {
                          const experience = [...profileState.experience];
                          experience[idx].role = e.target.value;
                          setProfileState(prev => ({ ...prev, experience }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-gray-400">Location coordinates</label>
                      <input 
                        type="text" 
                        value={exp.location} 
                        onChange={(e) => {
                          const experience = [...profileState.experience];
                          experience[idx].location = e.target.value;
                          setProfileState(prev => ({ ...prev, experience }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">Commencement Date</label>
                      <input 
                        type="text" 
                        value={exp.startDate} 
                        onChange={(e) => {
                          const experience = [...profileState.experience];
                          experience[idx].startDate = e.target.value;
                          setProfileState(prev => ({ ...prev, experience }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">Termination Date</label>
                      <input 
                        type="text" 
                        value={exp.endDate} 
                        onChange={(e) => {
                          const experience = [...profileState.experience];
                          experience[idx].endDate = e.target.value;
                          setProfileState(prev => ({ ...prev, experience }));
                        }}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Description narrative</label>
                    <textarea 
                      value={exp.description} 
                      onChange={(e) => {
                        const experience = [...profileState.experience];
                        experience[idx].description = e.target.value;
                        setProfileState(prev => ({ ...prev, experience }));
                      }}
                      className="w-full h-24 p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      const experience = profileState.experience.filter((_, i) => i !== idx);
                      setProfileState(prev => ({ ...prev, experience }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
