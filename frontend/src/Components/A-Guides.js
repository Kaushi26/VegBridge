import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminViewGuides = () => {
  const [guides, setGuides] = useState([]);
  const [type, setType] = useState('sorting'); // Default category
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await axios.get(`${apiURL}/api/guides/${type}`);
        setGuides(response.data);
      } catch (error) {
        console.error('Error fetching guides:', error);
      }
    };

    fetchGuides();
  }, [type, apiURL]);

  const handleDelete = async (id) => {
    console.log(`Deleting guide with ID: ${id}`);
    if (!window.confirm('Are you sure you want to delete this guide?')) return;
  
    try {
      const token = localStorage.getItem('token');
  
      const response = await axios.delete(`${apiURL}/api/guides/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
  
      if (response.ok) {
        alert('Guide deleted successfully!');
        setGuides(guides.filter((guide) => guide._id !== id)); // Update state
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error deleting guide');
      }
    } catch (error) {
      console.error('Error deleting guide:', error);
    }
  };
  
  return (
    <div className="container mt-5">
      <br />
      <br />
      <br />
      <div className="d-flex justify-content-center mb-4">
        <button
          className={`btn btn-outline-success mx-2 ${type === 'sorting' ? 'active' : ''}`}
          onClick={() => setType('sorting')}
        >
          Sorting
        </button>
        <button
          className={`btn btn-outline-success mx-2 ${type === 'preservation' ? 'active' : ''}`}
          onClick={() => setType('preservation')}
        >
          Preservation
        </button>
      </div>

      <div className="text-center mb-4">
        <Link
          to="/add-guide"
          className="btn btn-success position-fixed"
          style={{
            right: '3.5%',
            top: '20%',
            transform: 'translateY(-50%)',
            zIndex: 1000,
          }}
        >
          Add Guide
        </Link>
      </div>

      <div className="row">
        {guides.length > 0 ? (
          guides.map((guide) => (
            <div className="col-md-4 mb-4" key={guide._id}>
              <div className="card">
                <img
                  src={`${guide.image}`}
                  className="card-img-top"
                  alt={guide.title}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{guide.title}</h5>
                  <div className="d-flex justify-content-between">
                    <a href={guide.url} target="_blank" rel="noopener noreferrer" className="btn btn-success">
                      Watch Video
                    </a>
                    <button
                      onClick={() => handleDelete(guide._id)} // Pass the guide's _id
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No guides found for this category.</p>
        )}
      </div>
    </div>
  );
};

export default AdminViewGuides;
