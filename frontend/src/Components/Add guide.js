import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddGuide = () => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('sorting');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const apiURL = process.env.REACT_APP_API_NAME;
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !url || !type || !imageFile) {
      alert('Please fill all fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('url', url);
      formData.append('type', type);
      formData.append('image', imageFile);

      const token = localStorage.getItem('token');

      await axios.post(`${apiURL}/api/guides`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });


      // Clear form
      setTitle('');
      setUrl('');
      setType('sorting');
      setImageFile(null);
      setPreviewImage('');
      navigate('/admin-guides'); // Use useNavigate to redirect
      alert('Guide added successfully!');
    } catch (error) {
      console.error('Error adding guide:', error);
      alert('Failed to add guide.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    // Generate a local preview
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result);
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Add a New Guide</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="form-group mb-3">
          <label>Guide Title</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group mb-3">
          <label>Video URL</label>
          <input
            type="url"
            className="form-control"
            placeholder="Enter video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group mb-3">
          <label>Guide Type</label>
          <select
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="sorting">Sorting</option>
            <option value="preservation">Preservation</option>
          </select>
        </div>

        <div className="form-group mb-3">
          <label>Upload Cover Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="img-fluid mt-2"
              style={{ maxHeight: '200px' }}
            />
          )}
        </div>

        <button type="submit" className="btn btn-success">
          Add Guide
        </button>
      </form>
    </div>
  );
};

export default AddGuide;
