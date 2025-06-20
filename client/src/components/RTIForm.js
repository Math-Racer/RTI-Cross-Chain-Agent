// client/src/components/RTIForm.js
import React, { useState } from 'react';

function RTIForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bounty: '',
    deadline: '30',
    file: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="rti-form">
      <h2>Create New RTI Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Bounty (ETH):</label>
          <input
            type="number"
            name="bounty"
            value={formData.bounty}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Deadline (days):</label>
          <input
            type="number"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        <div className="form-group">
          <label>Attach File (optional):</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt"
          />
        </div>
        <button type="submit">Submit RTI</button>
      </form>
    </div>
  );
}

export default RTIForm;