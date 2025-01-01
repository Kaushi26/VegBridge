import React from 'react';
import Homepicture from '../Assets/Homepic 1.jpeg'

const HomePicture = () => {
  return (
    <section className="mt-5" style={{ marginTop: '80px' }}>
      <div className="container-fluid p-0">
        <img
          src={Homepicture}
          alt="A beautiful farming landscape"
          className="img-fluid w-100"
          style={{ height: '75vh', objectFit: 'cover' }}
        />
      </div>
    </section>
  );
};

export default HomePicture;
