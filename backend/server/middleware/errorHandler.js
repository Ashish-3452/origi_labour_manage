const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry. This record already exists.'
    });
  }
  
  // Foreign key error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference. Related record not found.'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

module.exports = errorHandler;