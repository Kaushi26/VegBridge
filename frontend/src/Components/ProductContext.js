import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch all products from the API
const fetchProducts = useCallback(async () => {
  const token = localStorage.getItem("token"); // Get token from localStorage
  try {
    const res = await axios.get(`${apiURL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Add Authorization header
      },
    });
    setProducts(res.data); // Set the fetched products
    console.log("API Response:", res.data); // Log the response data
  } catch (error) {
    console.error("Error fetching products:", error.message); // Log any errors
  }
}, [apiURL]);  // Memoize with `apiURL` as a dependency

  // Handle the approve status update
  const handleApprove = async (productId) => {
    try {
      await axios.put(`${apiURL}/api/products/${productId}/status`, {
        status: "Approved",
      });
      fetchProducts(); // Refetch products to reflect the updated status
    } catch (error) {
      console.error("Error approving product:", error.message);
    }
  };

  // Handle the reject status update
  const handleReject = async (productId) => {
    try {
      await axios.put(`${apiURL}/api/products/${productId}/status`, {
        status: "Rejected",
      });
      fetchProducts(); // Refetch products to reflect the updated status
    } catch (error) {
      console.error("Error rejecting product:", error.message);
    }
  };

  // Handle the delete product
  const deleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`${apiURL}/api/products/${productId}`, config);

      fetchProducts(); // Refetch products after deletion
    } catch (error) {
      console.error("Error deleting product:", error.message);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products on initial load
  }, [fetchProducts]); // Add `fetchProducts` to dependency array

  return (
    <ProductContext.Provider
      value={{
        products,
        fetchProducts,
        handleApprove,
        handleReject,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
};

export default ProductContext;
