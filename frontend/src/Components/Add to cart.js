import React from 'react';
import { useCartContext } from './CartContext';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart } = useCartContext();


  const calculateTotal = () =>
    cart.reduce((total, item) => total + item.price * item.selectedQuantity, 0);

  return (
    <div className="container-fluid mt-5 pt-5" style={{ backgroundColor: '#e6e6e6', minHeight: '80vh' }}>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow p-3 p-sm-4">
            <h2 className="text-center mb-4">Your Cart</h2>
            <h4 className="mb-3">Items in Your Cart</h4>

            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              cart.map((item, index) => (
                <div className="d-flex align-items-center mb-3" key={index}>
                  <img
                    src={item.image ? item.image : 'Cart https://via.placeholder.com/150'}
                    alt="Item"
                    width="100"
                    height="100"
                    className="me-3 rounded"
                  />
                  <div className="w-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="mb-1 fw-bold">{item.name}</p>
                        <small className="text-muted">Available Quantity: {item.quantity} kg</small>
                        <br />
                        <small className="text-muted">Quality: {item.grade}</small>
                        <br />
                        <small className="text-muted">Location: {item.location}</small>
                        <br />
                        <small className="text-muted">Price Per Kg: LKR {item.price}</small>
                      </div>
                      <p className="mb-0 fw-bold">LKR {(item.price * item.selectedQuantity).toFixed(2)}</p>
                    </div>

                    <div className="mb-2">
                      <p className="fw-bold">Selected Quantity: {item.selectedQuantity} kg</p>
                    </div>

                    <div className="d-flex justify-content-between mt-2">
                      <button
                        className="btn btn-outline-secondary w-25"
                        onClick={() => updateCartItem(item.id, index, -1)}
                        disabled={item.selectedQuantity <= 1}
                      >
                        -
                      </button>
                      <button
                        className="btn btn-outline-secondary w-25"
                        onClick={() => updateCartItem(item.id, index, 1)}
                        disabled={item.selectedQuantity >= item.quantity}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-outline-danger w-25"
                        onClick={() => removeFromCart(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h5>Total</h5>
              <h5>LKR {calculateTotal().toFixed(2)}</h5>
            </div>
            <Link to="/checkout" state={{ cartItems: cart }} className="btn btn-success btn-block mt-3">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
