
class ApiResponse {
 
  constructor(statusCode, data = null, message = "Success") {
    this.status = "success";
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;

