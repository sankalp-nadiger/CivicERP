class CustomError extends Error {
    statusCode: number;
    
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      
      // Maintains proper stack trace for where our error was thrown
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  const errorHandler = (statusCode: number, message: string): CustomError => {
    return new CustomError(statusCode, message);
  };
  
  export default errorHandler;