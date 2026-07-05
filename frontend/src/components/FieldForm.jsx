import React, { useState, useEffect } from 'react';

const CROP_OPTIONS = [
  { value: 'Tomato', label: '🍅 Tomato' },
  { value: 'Wheat', label: '🌾 Wheat' },
  { value: 'Maize', label: '🌽 Maize' },
];

const SOIL_OPTIONS = [
  { value: 'Sand', label: 'Sandy Soil' },
  { value: 'Sandy Loam', label: 'Sandy Loam' },
  { value: 'Loam', label: 'Loam (Balanced)' },
  { value: 'Silt Loam', label: 'Silt Loam' },
  { value: 'Clay', label: 'Clay Soil' },
  { value: 'Clay Loam', label: 'Clay Loam' },
];

const CROP_STAGES = {
  Tomato: [
    'Transplant',
    'Vegetative',
    'Flowering',
    'Yield Formation',
    'Ripening'
  ],
  Wheat: [
    'Seedling',
    'Tillering',
    'Jointing',
    'Booting',
    'Flowering',
    'Grain Filling'
  ],
  Maize: [
    'Seedling',
    'Vegetative',
    'Tasseling',
    'Silking',
    'Pollination',
    'Milk',
    'Dough',
    'Maturity'
  ]
};

export default function FieldForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    crop: 'Tomato',
    soil_type: 'Loam',
    area_sqm: '',
    latitude: '',
    longitude: '',
    growth_stage: 'Transplant',
  });

  const [errors, setErrors] = useState({});

  // Reset/update growth stage when crop changes
  useEffect(() => {
    const stages = CROP_STAGES[formData.crop] || [];
    setFormData(prev => ({
      ...prev,
      growth_stage: stages[0] || ''
    }));
  }, [formData.crop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    
    const area = parseFloat(formData.area_sqm);
    if (isNaN(area) || area <= 0) tempErrors.area_sqm = 'Area must be > 0 m²';
    
    const lat = parseFloat(formData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) tempErrors.latitude = 'Lat must be between -90 and 90';
    
    const lon = parseFloat(formData.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) tempErrors.longitude = 'Lon must be between -180 and 180';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name,
      crop: formData.crop,
      soil_type: formData.soil_type,
      area_sqm: parseFloat(formData.area_sqm),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      growth_stage: formData.growth_stage,
      last_watered_at: null // Default to never
    });

    // Reset simple values
    setFormData(prev => ({
      ...prev,
      name: '',
      area_sqm: '',
    }));
  };

  const stages = CROP_STAGES[formData.crop] || [];

  return (
    <div className="bg-surface border border-water/10 rounded-[6px] p-5">
      <h3 className="font-display text-[14px] tracking-wider uppercase text-text-dim border-b border-water/10 pb-2 mb-4">
        Deploy New Field Sensor
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
        {/* Field Name */}
        <div>
          <label className="block text-text-dim mb-1 font-medium">Field Designation Name</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. North Ridge Orchard"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 text-text placeholder-text-dim/30 focus:border-water outline-none transition-colors"
          />
          {errors.name && <span className="text-wheat text-[11px] mt-1 block">{errors.name}</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Crop */}
          <div>
            <label className="block text-text-dim mb-1 font-medium">Crop Profile</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 text-text focus:border-water outline-none transition-colors"
            >
              {CROP_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-surface">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Growth Stage */}
          <div>
            <label className="block text-text-dim mb-1 font-medium">Growth Phase</label>
            <select
              name="growth_stage"
              value={formData.growth_stage}
              onChange={handleChange}
              className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 text-text focus:border-water outline-none transition-colors"
            >
              {stages.map(stage => (
                <option key={stage} value={stage} className="bg-surface">
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Soil Type */}
        <div>
          <label className="block text-text-dim mb-1 font-medium">Soil Class</label>
          <select
            name="soil_type"
            value={formData.soil_type}
            onChange={handleChange}
            className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 text-text focus:border-water outline-none transition-colors"
          >
            {SOIL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-surface">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="block text-text-dim mb-1 font-medium">Field Area (m²)</label>
          <input
            type="number"
            name="area_sqm"
            placeholder="e.g. 1500"
            value={formData.area_sqm}
            onChange={handleChange}
            className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 font-mono text-text placeholder-text-dim/30 focus:border-water outline-none transition-colors"
          />
          {errors.area_sqm && <span className="text-wheat text-[11px] mt-1 block">{errors.area_sqm}</span>}
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-text-dim mb-1 font-medium">Latitude</label>
            <input
              type="number"
              name="latitude"
              step="any"
              placeholder="e.g. 36.7783"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 font-mono text-text placeholder-text-dim/30 focus:border-water outline-none transition-colors"
            />
            {errors.latitude && <span className="text-wheat text-[11px] mt-1 block">{errors.latitude}</span>}
          </div>
          <div>
            <label className="block text-text-dim mb-1 font-medium">Longitude</label>
            <input
              type="number"
              name="longitude"
              step="any"
              placeholder="e.g. -119.4179"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full bg-bg border border-water/10 rounded-[4px] px-3 py-2 font-mono text-text placeholder-text-dim/30 focus:border-water outline-none transition-colors"
            />
            {errors.longitude && <span className="text-wheat text-[11px] mt-1 block">{errors.longitude}</span>}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-water hover:bg-water/80 disabled:bg-water/30 text-bg font-display font-bold uppercase tracking-wider py-2.5 rounded-[4px] transition-colors mt-2"
        >
          {isLoading ? 'Processing...' : 'Register Sensor'}
        </button>
      </form>
    </div>
  );
}
