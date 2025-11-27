export const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res,
  message = "Internal server error",
  statusCode = 500,
  error = null,
) =>{
  if (error && process.env.NODE_ENV === "development") {
    console.error("Error details:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error && { error }),
  });
};

export const sendPaginated = (
  res,
  data,
  page,
  limit,
  total,
  message = "Data fetched successfully",
) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: Array.isArray(errors) ? errors : [errors],
  });
};

// HTTP 204 - Success with no content
export const sendNoContent = (res) => {
  return res.status(204).end();
};

// HTTP 201 - Resource created successfully
export const sendCreated = (res, data, message = "Resource created successfully") => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};
